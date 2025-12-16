import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { unstable_cache } from "next/cache";

const SECRET = process.env.ENCRYPTION_SECRET!;

/* -------------------------------------------------------
   CACHED QUERY FUNCTION
------------------------------------------------------- */
const getPaymentsCached = unstable_cache(
    async (
        landlordId: string,
        propertyId?: string | null,
        month?: string | null
    ) => {
        let query = `
            SELECT
                p.payment_id,
                p.payment_type,
                p.amount_paid,
                p.payment_status,
                p.payment_date,
                p.receipt_reference,
                p.created_at,
                u.unit_name,
                pr.property_name,
                usr.firstName,
                usr.lastName
            FROM Payment p
                JOIN LeaseAgreement la ON p.agreement_id = la.agreement_id
                JOIN Tenant t ON la.tenant_id = t.tenant_id
                JOIN User usr ON t.user_id = usr.user_id
                JOIN Unit u ON la.unit_id = u.unit_id
                JOIN Property pr ON u.property_id = pr.property_id
            WHERE pr.landlord_id = ?
              AND p.payment_status = 'confirmed'
        `;

        const params: any[] = [landlordId];

        if (propertyId) {
            query += ` AND pr.property_id = ?`;
            params.push(propertyId);
        }

        if (month) {
            query += ` AND DATE_FORMAT(p.payment_date, '%Y-%m') = ?`;
            params.push(month);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows]: any = await db.query(query, params);

        /* ---------------- Decrypt Names ---------------- */
        return rows.map((row: any) => {
            let firstName = "";
            let lastName = "";

            try {
                if (row.firstName) {
                    firstName = decryptData(
                        JSON.parse(row.firstName),
                        SECRET
                    );
                }

                if (row.lastName) {
                    lastName = decryptData(
                        JSON.parse(row.lastName),
                        SECRET
                    );
                }
            } catch (err) {
                console.error(
                    `❌ Decryption failed for payment ${row.payment_id}`,
                    err
                );
            }

            return {
                ...row,
                firstName,
                lastName,
                tenant_name: `${firstName} ${lastName}`.trim() || "Unknown Tenant",
            };
        });
    },
    // 🔑 cache key factory
    (landlordId, propertyId, month) => [
        "payments",
        landlordId,
        propertyId ?? "all",
        month ?? "all",
    ],
    {
        revalidate: 60, // ⏱ 1 minute
        tags: ["payments"],
    }
);

/* -------------------------------------------------------
   ROUTE HANDLER
------------------------------------------------------- */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const landlordId = searchParams.get("landlord_id");
        const propertyId = searchParams.get("property_id");
        const month = searchParams.get("month"); // YYYY-MM

        if (!landlordId) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        const result = await getPaymentsCached(
            landlordId,
            propertyId,
            month
        );

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
