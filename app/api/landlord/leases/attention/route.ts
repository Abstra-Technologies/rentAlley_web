import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlordId = searchParams.get("landlord_id");

    if (!landlordId) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        /* ================= PROSPECTIVE TENANTS ================= */
        const [prospective]: any = await db.query(
            `
      SELECT
        pt.id,
        u.unit_name,
        p.property_name,
        usr.firstName,
        usr.lastName,
        'prospective' AS type,
        'New application pending review' AS note
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN User usr ON t.user_id = usr.user_id
      JOIN Unit u ON pt.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND pt.status = 'pending'
      ORDER BY pt.created_at DESC
      `,
            [landlordId]
        );

        /* ================= DRAFT LEASES ================= */
        const [drafts]: any = await db.query(
            `
      SELECT
        la.agreement_id AS lease_id,
        u.unit_name,
        p.property_name,
        usr.firstName,
        usr.lastName,
        'draft' AS type,
        'Lease draft not yet finalized' AS note
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User usr ON t.user_id = usr.user_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND la.status = 'draft'
      ORDER BY la.created_at DESC
      `,
            [landlordId]
        );

        /* ================= LEASES NEAR ENDING ================= */
        const [ending]: any = await db.query(
            `
      SELECT
        la.agreement_id AS lease_id,
        u.unit_name,
        p.property_name,
        usr.firstName,
        usr.lastName,
        DATEDIFF(la.end_date, CURDATE()) AS daysLeft,
        'ending' AS type
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User usr ON t.user_id = usr.user_id
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND la.status = 'active'
        AND la.end_date BETWEEN CURDATE()
        AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY la.end_date ASC
      `,
            [landlordId]
        );

        /* ================= NORMALIZE + DECRYPT ================= */
        const normalizeName = (row: any) => {
            const first = safeDecrypt(row.firstName);
            const last = safeDecrypt(row.lastName);
            return `${first ?? ""} ${last ?? ""}`.trim() || "Unknown Tenant";
        };

        const result = [
            ...prospective.map((r: any) => ({
                type: "prospective",
                unit: `${r.property_name} • ${r.unit_name}`,
                tenant: normalizeName(r),
                note: r.note,
            })),

            ...ending.map((r: any) => ({
                lease_id: r.lease_id,
                type: "ending",
                unit: `${r.property_name} • ${r.unit_name}`,
                tenant: normalizeName(r),
                note: `${r.daysLeft} days left`,
                daysLeft: r.daysLeft,
            })),

            ...drafts.map((r: any) => ({
                lease_id: r.lease_id,
                type: "draft",
                unit: `${r.property_name} • ${r.unit_name}`,
                tenant: normalizeName(r),
                note: r.note,
            })),
        ];

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("[LEASE_ATTENTION_API_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to fetch lease attention data" },
            { status: 500 }
        );
    }
}
