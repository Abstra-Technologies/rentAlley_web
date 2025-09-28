
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "../../../../crypto/encrypt";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agreementId = searchParams.get("agreementId");

        if (!agreementId) {
            return NextResponse.json(
                { error: "agreementId is required" },
                { status: 400 }
            );
        }

        const [rows] = await db.execute(
            `
                SELECT
                    u.user_id,
                    u.firstName,
                    u.lastName,
                    u.email,
                    t.tenant_id,
                    la.agreement_id
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User u ON t.user_id = u.user_id
                WHERE la.agreement_id = ?
                LIMIT 1
            `,
            [agreementId]
        );

        // @ts-ignore
        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "No tenant found for this agreement" }, { status: 404 });
        }

        // @ts-ignore
        const tenant = rows[0];

        // 🔑 decrypt with secret
        const decryptedFirstName = decryptData(
            JSON.parse(tenant.firstName),
            process.env.ENCRYPTION_SECRET!
        );

        const decryptedLastName = decryptData(
            JSON.parse(tenant.lastName),
            process.env.ENCRYPTION_SECRET!
        );

        const decryptedEmail = decryptData(
            JSON.parse(tenant.email),
            process.env.ENCRYPTION_SECRET!
        );


        return NextResponse.json({
            tenantId: tenant.tenant_id,
            userId: tenant.user_id,
            name: `${decryptedFirstName} ${decryptedLastName}`,
            email: decryptedEmail,
            agreementId: tenant.agreement_id,
        });
    } catch (err) {
        console.error("Error in getByAgreement API:", err);
        return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }
}
