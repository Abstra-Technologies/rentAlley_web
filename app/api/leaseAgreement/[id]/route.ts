
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";
const SECRET_KEY = process.env.ENCRYPTION_SECRET!;

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const agreementId = params.id;

        if (!agreementId) {
            return NextResponse.json(
                { error: "Agreement ID is required" },
                { status: 400 }
            );
        }

        const [rows] = await db.execute(
            `
                SELECT
                    la.agreement_id,
                    la.agreement_url,
                    la.status,
                    la.start_date,
                    la.end_date,
                    la.security_deposit_amount,
                    la.advance_payment_amount,
                    u.email AS tenantEmail,
                    p.property_name,
                    un.unit_name
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User u ON t.user_id = u.user_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                WHERE la.agreement_id = ?
                LIMIT 1
            `,
            [agreementId]
        );

        if (!rows || (rows as any[]).length === 0) {
            return NextResponse.json(
                { error: "Lease agreement not found" },
                { status: 404 }
            );
        }

        const agreement = (rows as any)[0];

        // 🔑 Decrypt agreement_url if it looks encrypted
        let decryptedUrl: string | null = null;
        try {
            if (agreement.agreement_url?.startsWith("{")) {
                // it's encrypted JSON
                decryptedUrl = decryptData(
                    JSON.parse(agreement.agreement_url),
                    SECRET_KEY
                );
            } else {
                // already plain URL
                decryptedUrl = agreement.agreement_url;
            }
        } catch (e) {
            console.error("❌ Failed to decrypt agreement_url:", e);
        }

        return NextResponse.json({
            agreementId: agreement.agreement_id,
            agreementUrl: decryptedUrl,
            status: agreement.status,
            tenantEmail: agreement.tenantEmail,
            property: agreement.property_name,
            unit: agreement.unit_name,
            startDate: agreement.start_date,
            endDate: agreement.end_date,
            deposit: agreement.security_deposit_amount,
            advance: agreement.advance_payment_amount,
        });
    } catch (err) {
        console.error("❌ Error fetching lease agreement:", err);
        return NextResponse.json(
            { error: "Failed to fetch lease agreement", details: String(err) },
            { status: 500 }
        );
    }
}
