import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
import { unstable_cache } from "next/cache";
import crypto from "crypto";

const SECRET = process.env.ENCRYPTION_SECRET!;

const sha256 = (value: string) =>
    crypto.createHash("sha256").update(value).digest("hex");

/* -------------------------------------------------------
   CACHED QUERY FUNCTION (ENHANCED)
------------------------------------------------------- */
const getPaymentsCached = unstable_cache(
    async (
        landlordId: string,
        propertyId?: string | null,
        _month?: string | null,
        search?: string | null,
        paymentType?: string | null,
        dateRange?: string | null
    ) => {
        let query = `
      SELECT
        /* ================= PAYMENT ================= */
        p.payment_id,
        p.bill_id,
        p.agreement_id,
        p.payment_type,
        p.amount_paid,
        p.payment_method_id,
        p.payment_status,
        p.payout_status,
        p.receipt_reference,
        p.payment_date,
        p.proof_of_payment,
        
        p.gross_amount,
        p.platform_fee,
        p.gateway_vat,
        p.net_amount,
        p.gateway_fee,
        p.created_at,

        /* ================= BILLING ================= */
        b.billing_id,
        b.billing_period,
        b.total_water_amount,
        b.total_electricity_amount,
        b.total_amount_due,
        b.status AS billing_status,
        b.due_date,
        b.paid_at,
        b.unit_id,

        /* ================= DISPLAY ================= */
        u.unit_name,
        pr.property_name,
        usr.firstName,
        usr.lastName,
        usr.nameHashed,
        usr.nameTokens

      FROM Payment p
        LEFT JOIN Billing b ON p.bill_id = b.billing_id
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
        } else if (dateRange?.startsWith("year:")) {
            query += ` AND YEAR(p.payment_date) = ?`;
            params.push(Number(dateRange.split(":")[1]));
        }

        /* ---------- SEARCH ---------- */
        if (search) {
            const clean = search.toLowerCase().trim();
            const fullHash = sha256(clean);

            const tokenHashes = clean
                .split(/\s+/)
                .filter(Boolean)
                .map(sha256);

            query += `
        AND (
          pr.property_name LIKE ?
          OR u.unit_name LIKE ?
          OR p.receipt_reference LIKE ?
          OR usr.nameHashed = ?
          OR JSON_CONTAINS(usr.nameTokens, ?)
        )
      `;

            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`,
                fullHash,
                JSON.stringify(tokenHashes)
            );
        }

        query += ` ORDER BY p.created_at DESC`;

        const [rows]: any = await db.query(query, params);

        /* ---------- DECRYPT DISPLAY NAME ONLY ---------- */
        return rows.map((row: any) => {
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
    },

    /* ---------- CACHE KEY ---------- */
    (
        landlordId,
        propertyId,
        _month,
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
