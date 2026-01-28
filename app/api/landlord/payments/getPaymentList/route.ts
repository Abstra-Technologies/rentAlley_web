import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { unstable_cache } from "next/cache";

const SECRET = process.env.ENCRYPTION_SECRET!;

/* -------------------------------------------------------
   CACHED QUERY FUNCTION (FIXED)
------------------------------------------------------- */
const getPaymentsCached = unstable_cache(
    async (
        landlordId: string,
        propertyId?: string | null,
        month?: string | null,
        search?: string | null,
        paymentType?: string | null,
        dateRange?: string | null
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

        /* ---------- Property ---------- */
        if (propertyId) {
            query += ` AND pr.property_id = ?`;
            params.push(propertyId);
        }

        /* ---------- Payment Type ---------- */
        if (paymentType && paymentType !== "all") {
            query += ` AND p.payment_type = ?`;
            params.push(paymentType);
        }

        /* ---------- Date Range ---------- */
        if (dateRange === "7") {
            query += ` AND p.payment_date >= NOW() - INTERVAL 7 DAY`;
        } else if (dateRange === "30") {
            query += ` AND p.payment_date >= NOW() - INTERVAL 30 DAY`;
        } else if (dateRange === "month") {
            query += `
        AND MONTH(p.payment_date) = MONTH(CURDATE())
        AND YEAR(p.payment_date) = YEAR(CURDATE())
      `;
        } else if (dateRange === "year") {
            query += ` AND YEAR(p.payment_date) = YEAR(CURDATE())`;
        }

        /* ---------- SQL SEARCH (NON-ENCRYPTED ONLY) ---------- */
        if (search) {
            query += `
        AND (
          pr.property_name LIKE ?
          OR u.unit_name LIKE ?
          OR p.receipt_reference LIKE ?
        )
      `;
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows]: any = await db.query(query, params);

        /* ---------- DECRYPT + NAME SEARCH ---------- */
        let decrypted = rows.map((row: any) => {
            let firstName = "";
            let lastName = "";

            try {
                if (row.firstName) {
                    firstName = decryptData(JSON.parse(row.firstName), SECRET);
                }
                if (row.lastName) {
                    lastName = decryptData(JSON.parse(row.lastName), SECRET);
                }
            } catch (err) {
                console.error(
                    `❌ Decryption failed for payment ${row.payment_id}`,
                    err
                );
            }

            return {
                ...row,
                tenant_name: `${firstName} ${lastName}`.trim() || "Unknown Tenant",
            };
        });

        /* ---------- TENANT NAME SEARCH (POST-DECRYPT) ---------- */
        if (search) {
            const lower = search.toLowerCase();
            decrypted = decrypted.filter((p: any) =>
                p.tenant_name.toLowerCase().includes(lower)
            );
        }

        return decrypted;
    },

    /* ---------- Cache Key ---------- */
    (
        landlordId,
        propertyId,
        month,
        search,
        paymentType,
        dateRange
    ) => [
        "payments",
        landlordId,
        propertyId ?? "all",
        search ?? "all",
        paymentType ?? "all",
        dateRange ?? "all",
    ],

    {
        revalidate: 60,
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
        const search = searchParams.get("search");
        const paymentType = searchParams.get("paymentType");
        const dateRange = searchParams.get("dateRange");

        if (!landlordId) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        const result = await getPaymentsCached(
            landlordId,
            propertyId,
            null,
            search,
            paymentType,
            dateRange
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
