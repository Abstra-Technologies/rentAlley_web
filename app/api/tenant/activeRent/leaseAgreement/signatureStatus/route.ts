import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agreement_id = searchParams.get("agreement_id");

        if (!agreement_id) {
            return NextResponse.json(
                { error: "Missing or invalid query parameter: agreement_id" },
                { status: 400 }
            );
        }

        /* ================= FETCH LEASE ================= */
        const [rows]: any = await db.query(
            `
            SELECT 
                la.agreement_id,
                la.status AS agreement_status,
                la.agreement_url,

                -- Dates
                la.start_date,
                la.end_date,
                la.move_in_date,

                -- 🔑 RENT FALLBACK
                COALESCE(NULLIF(la.rent_amount, 0), un.rent_amount) AS effective_rent_amount,
                la.rent_amount AS lease_rent_amount,
                un.rent_amount AS unit_rent_amount,

                -- Payments
                la.security_deposit_amount,
                la.advance_payment_amount,
                la.billing_due_day,

                -- Signature
                ls.id AS signature_id,
                ls.status AS signature_status,
                ls.signed_at,

                -- Tenant
                u.email AS tenant_email_enc,

                -- Property / Unit
                p.property_name,
                un.unit_name

            FROM rentalley_db.LeaseAgreement la
            LEFT JOIN rentalley_db.LeaseSignature ls 
                ON la.agreement_id = ls.agreement_id 
                AND ls.role = 'tenant'
            JOIN rentalley_db.Tenant t ON la.tenant_id = t.tenant_id
            JOIN rentalley_db.User u ON t.user_id = u.user_id
            JOIN rentalley_db.Unit un ON la.unit_id = un.unit_id
            JOIN rentalley_db.Property p ON un.property_id = p.property_id
            WHERE la.agreement_id = ?
            LIMIT 1
            `,
            [agreement_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "No lease found for the given agreement_id" },
                { status: 404 }
            );
        }

        const data = rows[0];

        /* ================= DECRYPT EMAIL ================= */
        let tenantEmail: string | null = null;
        try {
            if (
                data.tenant_email_enc?.startsWith("{") ||
                data.tenant_email_enc?.startsWith("[")
            ) {
                tenantEmail = decryptData(
                    JSON.parse(data.tenant_email_enc),
                    process.env.ENCRYPTION_SECRET!
                );
            } else {
                tenantEmail = data.tenant_email_enc;
            }
        } catch (err) {
            console.warn(
                `⚠️ Failed to decrypt tenant email for agreement_id ${agreement_id}`,
                err
            );
        }

        /* ================= DECRYPT LEASE URL ================= */
        let leaseUrl: string | null = null;
        try {
            if (
                data.agreement_url?.startsWith("{") ||
                data.agreement_url?.startsWith("[")
            ) {
                leaseUrl = decryptData(
                    JSON.parse(data.agreement_url),
                    process.env.ENCRYPTION_SECRET!
                );
            } else {
                leaseUrl = data.agreement_url;
            }
        } catch (err) {
            console.warn(
                `⚠️ Failed to decrypt lease URL for agreement_id ${agreement_id}`,
                err
            );
        }

        /* ================= SIGNATURE ================= */
        const tenantSignature = {
            id: data.signature_id ?? null,
            status: data.signature_status ?? "pending",
            signed_at: data.signed_at ?? null,
            email: tenantEmail,
        };

        /* ================= RESPONSE ================= */
        return NextResponse.json({
            success: true,

            agreement_id,
            agreement_status: data.agreement_status,

            property_name: data.property_name,
            unit_name: data.unit_name,

            agreement_url: leaseUrl,

            lease: {
                start_date: data.start_date,
                end_date: data.end_date,
                move_in_date: data.move_in_date,

                // 🔑 USE THIS IN UI
                rent_amount: data.effective_rent_amount,

                // (optional transparency)
                lease_rent_amount: data.lease_rent_amount,
                unit_rent_amount: data.unit_rent_amount,

                security_deposit_amount: data.security_deposit_amount,
                advance_payment_amount: data.advance_payment_amount,
                billing_due_day: data.billing_due_day,
            },

            tenant_signature: tenantSignature,
            updated_at: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("❌ Error fetching tenant lease signature:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch tenant lease signature data.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
