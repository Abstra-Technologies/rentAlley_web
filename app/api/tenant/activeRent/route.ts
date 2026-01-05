import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

//  Used in My Unit Page.
//  to ve simplified.

const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

const getTenantActiveLeases = unstable_cache(
    async (tenantId: string) => {
        /* -------------------------------------------------
           FETCH LEASE AGREEMENTS
        ------------------------------------------------- */
        const [leases]: any = await db.query(
            `
                SELECT
                    agreement_id,
                    tenant_id,
                    unit_id,
                    start_date,
                    end_date,
                    status,
                    updated_at
                FROM LeaseAgreement
                WHERE tenant_id = ?
                  AND status IN ('draft', 'active', 'expired', 'pending_signature')
                ORDER BY updated_at DESC
            `,
            [tenantId]
        );

        if (!leases?.length) return [];

        const results = [];

        for (const lease of leases) {
            /* -------------------------------------------------
               SIGNATURE STATUS
            ------------------------------------------------- */
            const [signatures]: any = await db.query(
                `
                SELECT role, status
                FROM LeaseSignature
                WHERE agreement_id = ?
                `,
                [lease.agreement_id]
            );

            let landlordSig = "pending";
            let tenantSig = "pending";

            for (const sig of signatures || []) {
                if (sig.role === "landlord") landlordSig = sig.status;
                if (sig.role === "tenant") tenantSig = sig.status;
            }

            let leaseSignature = "pending";
            if (landlordSig === "signed" && tenantSig === "signed")
                leaseSignature = "completed";
            else if (landlordSig === "signed")
                leaseSignature = "landlord_signed";
            else if (tenantSig === "signed")
                leaseSignature = "tenant_signed";

            if (lease.status === "active") leaseSignature = "active";

            /* -------------------------------------------------
               UNIT + PROPERTY + LANDLORD
            ------------------------------------------------- */
            const [unitRows]: any = await db.query(
                `
                SELECT
                    u.unit_id,
                    u.unit_name,
                    u.unit_size,
                    u.unit_style,
                    u.rent_amount,
                    u.furnish,
                    u.status AS unit_status,

                    p.property_id,
                    p.property_name,
                    p.property_type,
                    p.street,
                    p.brgy_district,
                    p.city,
                    p.province,
                    p.zip_code,

                    l.user_id AS landlord_user_id,
                    usr.firstName AS enc_first_name,
                    usr.lastName  AS enc_last_name
                FROM Unit u
                INNER JOIN Property p ON u.property_id = p.property_id
                INNER JOIN Landlord l ON p.landlord_id = l.landlord_id
                INNER JOIN User usr ON l.user_id = usr.user_id
                WHERE u.unit_id = ?
                LIMIT 1
                `,
                [lease.unit_id]
            );

            if (!unitRows?.length) continue;
            const unit = unitRows[0];

            /* -------------------------------------------------
               DECRYPT LANDLORD NAME
            ------------------------------------------------- */
            let landlord_name = "Landlord";
            try {
                const first = decryptData(JSON.parse(unit.enc_first_name), SECRET_KEY);
                const last = decryptData(JSON.parse(unit.enc_last_name), SECRET_KEY);
                landlord_name = `${first} ${last}`;
            } catch {}

            /* -------------------------------------------------
               UNIT PHOTOS
            ------------------------------------------------- */
            const [photos]: any = await db.query(
                `
                SELECT photo_url
                FROM UnitPhoto
                WHERE unit_id = ?
                ORDER BY id ASC
                `,
                [lease.unit_id]
            );

            const unit_photos =
                photos
                    ?.map((p: any) => {
                        try {
                            return decryptData(JSON.parse(p.photo_url), SECRET_KEY);
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean) || [];

            /* -------------------------------------------------
               FINAL MERGED OBJECT
            ------------------------------------------------- */
            results.push({
                agreement_id: lease.agreement_id,

                lease_status: lease.status,
                leaseSignature,

                start_date: lease.start_date,
                end_date: lease.end_date,

                unit_id: unit.unit_id,
                unit_name: unit.unit_name,
                unit_size: unit.unit_size,
                unit_style: unit.unit_style,
                rent_amount: unit.rent_amount,
                furnish: unit.furnish,
                unit_status: unit.unit_status,

                property_id: unit.property_id,
                property_name: unit.property_name,
                property_type: unit.property_type,

                street: unit.street,
                brgy_district: unit.brgy_district,
                city: unit.city,
                province: unit.province,
                zip_code: unit.zip_code,

                landlord_user_id: unit.landlord_user_id,
                landlord_name,

                unit_photos,
            });
        }

        return results;
    },
    (tenantId: string) => [`tenant-active-leases`, tenantId],
    {
        revalidate: 60, // seconds
        tags: ["tenant-leases"],
    }
);

/* =========================================================
   API HANDLER
========================================================= */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json(
                { message: "Tenant ID is required" },
                { status: 400 }
            );
        }

        const leases = await getTenantActiveLeases(tenantId);

        if (!leases.length) {
            return NextResponse.json(
                { message: "No active leases found" },
                { status: 404 }
            );
        }

        return NextResponse.json(leases, { status: 200 });

    } catch (error) {
        console.error("TENANT ACTIVE LEASE API ERROR:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
