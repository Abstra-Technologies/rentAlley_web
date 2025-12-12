import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

async function safeDecrypt(value: string | null) {
    try {
        if (value && value.startsWith("{")) {
            return await decryptData(JSON.parse(value), process.env.ENCRYPTION_SECRET!);
        }
        return value ?? "";
    } catch (err) {
        console.error("Decrypt failed:", err);
        return ""; // always return string
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const search = searchParams.get("search") || "";
        const paymentStatus = searchParams.get("status") || "";
        const payoutStatus = searchParams.get("payoutStatus") || "";
        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const offset = (page - 1) * limit;

        let where = "WHERE 1=1";
        const params: any[] = [];

        // Search — ONLY on non-encrypted fields
        if (search) {
            where += ` AND (p.payment_id LIKE ? OR pm.method_name LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (paymentStatus) {
            where += " AND p.payment_status = ?";
            params.push(paymentStatus);
        }

        if (payoutStatus) {
            where += " AND p.payout_status = ?";
            params.push(payoutStatus);
        }

        // MAIN QUERY
        const sql = `
            SELECT
                p.payment_id,
                p.payment_type,
                p.amount_paid,
                p.payment_status,
                p.payout_status,
                p.payment_date,
                p.receipt_reference,

                pm.method_name AS payment_method,

                -- Tenant
                t.tenant_id,
                u_tenant.firstName AS tenant_firstName,
                u_tenant.lastName AS tenant_lastName,
                u_tenant.profilePicture AS tenant_profile,

                -- Landlord
                l.landlord_id,
                u_landlord.firstName AS landlord_firstName,
                u_landlord.lastName AS landlord_lastName,
                u_landlord.profilePicture AS landlord_profile,

                -- Property / Unit
                pr.property_id,
                pr.property_name,
                u.unit_id,
                u.unit_name

            FROM Payment p
            LEFT JOIN PaymentMethod pm ON pm.method_id = p.payment_method_id
            LEFT JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User u_tenant ON t.user_id = u_tenant.user_id
            LEFT JOIN Unit u ON la.unit_id = u.unit_id
            LEFT JOIN Property pr ON pr.property_id = u.property_id
            LEFT JOIN Landlord l ON l.landlord_id = pr.landlord_id
            LEFT JOIN User u_landlord ON l.user_id = u_landlord.user_id

            ${where}
            ORDER BY p.payment_date DESC
            LIMIT ? OFFSET ?;
        `;

        const [rows]: any = await db.query(sql, [...params, limit, offset]);

        // COUNT QUERY
        const countSql = `
            SELECT COUNT(*) AS total
            FROM Payment p
            LEFT JOIN PaymentMethod pm ON pm.method_id = p.payment_method_id
            LEFT JOIN LeaseAgreement la ON la.agreement_id = p.agreement_id
            LEFT JOIN Tenant t ON la.tenant_id = t.tenant_id
            LEFT JOIN User u_tenant ON t.user_id = u_tenant.user_id
            LEFT JOIN Unit u ON la.unit_id = u.unit_id
            LEFT JOIN Property pr ON pr.property_id = u.property_id
            LEFT JOIN Landlord l ON l.landlord_id = pr.landlord_id
            LEFT JOIN User u_landlord ON l.user_id = u_landlord.user_id
            ${where}
        `;

        const [countRows]: any = await db.query(countSql, params);
        const total = countRows[0]?.total || 0;

        //  SAFE DECRYPT + SAFE STRING RETURNS
        const payments = await Promise.all(
            rows.map(async (row: any) => {
                const landlordFirst = await safeDecrypt(row.landlord_firstName);
                const landlordLast = await safeDecrypt(row.landlord_lastName);
                const landlordPic = await safeDecrypt(row.landlord_profile);

                const tenantFirst = await safeDecrypt(row.tenant_firstName);
                const tenantLast = await safeDecrypt(row.tenant_lastName);
                const tenantPic = await safeDecrypt(row.tenant_profile);

                return {
                    payment_id: row.payment_id ?? null,

                    // FRONTEND EXPECTS THESE NAMES:
                    status: row.payment_status ?? "",
                    method: row.payment_method ?? "",
                    amount: row.amount_paid ?? 0,
                    date: row.payment_date ?? "",
                    landlord_name: `${landlordFirst ?? ""} ${landlordLast ?? ""}`.trim(),

                    // ALSO KEEP ORIGINAL STRUCTURE
                    payment_type: row.payment_type ?? "",
                    payment_status: row.payment_status ?? "",
                    payout_status: row.payout_status ?? "",
                    receipt_reference: row.receipt_reference ?? "",

                    landlord: {
                        landlord_id: row.landlord_id ?? null,
                        firstName: landlordFirst ?? "",
                        lastName: landlordLast ?? "",
                        profilePicture: landlordPic ?? "",
                    },

                    tenant: {
                        tenant_id: row.tenant_id ?? null,
                        firstName: tenantFirst ?? "",
                        lastName: tenantLast ?? "",
                        profilePicture: tenantPic ?? "",
                    },

                    property: {
                        property_id: row.property_id ?? null,
                        property_name: row.property_name ?? "",
                    },

                    unit: {
                        unit_id: row.unit_id ?? null,
                        unit_name: row.unit_name ?? "",
                    },
                };
            })
        );

        return NextResponse.json(
            { success: true, total, page, limit, payments },
            { status: 200 }
        );
    } catch (err) {
        console.error("❌ Error in payouts/getListofPayments:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
