import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Missing landlord_id" },
            { status: 400 }
        );
    }

    try {
        /* ================= PROSPECTIVE ================= */
        const [prospective]: any = await db.query(
            `
      SELECT
        pt.id AS lease_id,
        pr.property_id,
        pr.property_name,
        'prospective' AS type,
        u.unit_name AS unit,
        usr.firstName,
        usr.lastName,
        'New tenant inquiry' AS note,
        NULL AS daysLeft
      FROM ProspectiveTenant pt
      JOIN Tenant t ON pt.tenant_id = t.tenant_id
      JOIN User usr ON t.user_id = usr.user_id
      JOIN Unit u ON pt.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
        AND pt.status = 'pending'
      `,
            [landlord_id]
        );

        /* ================= LEASE ENDING + EXPIRED ================= */
        const [ending]: any = await db.query(
            `
      SELECT
        la.agreement_id AS lease_id,
        pr.property_id,
        pr.property_name,
        'ending' AS type,
        u.unit_name AS unit,
        usr.firstName,
        usr.lastName,
        CASE
          WHEN la.end_date < CURDATE()
            THEN CONCAT('Expired on ', DATE_FORMAT(la.end_date, '%b %d'))
          ELSE CONCAT('Ends on ', DATE_FORMAT(la.end_date, '%b %d'))
        END AS note,
        DATEDIFF(la.end_date, CURDATE()) AS daysLeft
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User usr ON t.user_id = usr.user_id
      WHERE pr.landlord_id = ?
        AND la.end_date IS NOT NULL
        AND (
          la.status IN ('active', 'expired')
          OR la.end_date < CURDATE()
        )
        AND DATEDIFF(la.end_date, CURDATE()) <= 30
      ORDER BY daysLeft ASC
      `,
            [landlord_id]
        );

        /* ================= DRAFT LEASES ================= */
        const [drafts]: any = await db.query(
            `
      SELECT
        la.agreement_id AS lease_id,
        pr.property_id,
        pr.property_name,
        'draft' AS type,
        u.unit_name AS unit,
        usr.firstName,
        usr.lastName,
        'Draft lease not yet finalized' AS note,
        NULL AS daysLeft
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property pr ON u.property_id = pr.property_id
      LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
      LEFT JOIN User usr ON t.user_id = usr.user_id
      WHERE pr.landlord_id = ?
        AND la.status = 'draft'
      ORDER BY la.updated_at DESC
      `,
            [landlord_id]
        );

        /* ================= NORMALIZE + DECRYPT ================= */
        const normalize = (rows: any[]) =>
            rows.map((r) => ({
                lease_id: r.lease_id,
                property_id: r.property_id,
                property_name: r.property_name,
                type: r.type,
                unit: r.unit,
                tenant:
                    [safeDecrypt(r.firstName), safeDecrypt(r.lastName)]
                        .filter(Boolean)
                        .join(" ") || "Unknown Tenant",
                note: r.note,
                daysLeft: r.daysLeft,
            }));

        return NextResponse.json([
            ...normalize(prospective),
            ...normalize(ending),
            ...normalize(drafts),
        ]);
    } catch (err) {
        console.error("[LEASE_ATTENTION_API]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
