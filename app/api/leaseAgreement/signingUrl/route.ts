
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocuSignToken } from "@/lib/docusignAuth";
import { decryptData } from "@/crypto/encrypt";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agreementId, role = "landlord", landlordEmail } = body;

        console.log("📩 Incoming signingUrl request body:", body);

        if (!agreementId) {
            console.warn("❌ Missing agreementId in request body");
            return NextResponse.json(
                { error: "agreementId is required" },
                { status: 400 }
            );
        }

        const { accessToken, accountId } = await getDocuSignToken();
        console.log("✅ Got DocuSign token for account:", accountId);

        // 🔹 Fetch envelopeId + encrypted tenant email from DB
        const [rows] = await db.execute(
            `
                SELECT
                    la.docusign_envelope_id AS envelopeId,
                    u.email AS tenantEmailEnc
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User u ON t.user_id = u.user_id
                WHERE la.agreement_id = ?
                LIMIT 1
            `,
            [agreementId]
        );

        console.log("🗄️ DB query result:", rows);

        if (!rows || (rows as any[]).length === 0) {
            console.warn("❌ No envelope or tenant found for agreement:", agreementId);
            return NextResponse.json(
                { error: "No envelope or tenant found for this agreement" },
                { status: 404 }
            );
        }

        // @ts-ignore
        const { envelopeId, tenantEmailEnc } = rows[0] as any;

        console.log("📦 envelopeId:", envelopeId, "tenantEmailEnc:", tenantEmailEnc);

        if (!envelopeId) {
            console.warn("❌ EnvelopeId is missing in DB for agreement:", agreementId);
            return NextResponse.json(
                { error: "No envelopeId stored for this agreement" },
                { status: 400 }
            );
        }

        // 🔑 Decrypt tenant email
        let tenantEmail: string | null = null;
        try {
            // @ts-ignore
            tenantEmail = decryptData(JSON.parse(tenantEmailEnc), process.env.ENCRYPTION_SECRET);
            console.log("✅ Decrypted tenantEmail:", tenantEmail);
        } catch (e) {
            console.error("❌ Failed to decrypt tenant email:", e);
            return NextResponse.json(
                { error: "Failed to decrypt tenant email" },
                { status: 500 }
            );
        }

        const isLandlord = role === "landlord";
        if (isLandlord && !landlordEmail) {
            console.warn("❌ Landlord role chosen but landlordEmail missing");
            return NextResponse.json(
                { error: "Landlord email must be provided when role is landlord" },
                { status: 400 }
            );
        }

        // ✅ Recipient view request
        const viewRequest = {
            returnUrl: "http://localhost:3000/pages/lease/signed",
            authenticationMethod: "none",
            email: isLandlord ? landlordEmail : tenantEmail,
            userName: isLandlord ? "Landlord" : "Tenant",
            clientUserId: isLandlord ? "1001" : "1002",
        };

        console.log("📤 Sending recipient view request:", viewRequest);

        // ✅ Request fresh signing URL
        const viewRes = await fetch(
            `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(viewRequest),
            }
        );

        const viewResult = await viewRes.json();
        console.log("📥 DocuSign response:", viewResult);

        if (!viewRes.ok || !viewResult.url) {
            console.error("❌ Failed to regenerate signing link", viewResult);
            return NextResponse.json(
                { error: "Failed to regenerate signing link", details: viewResult },
                { status: 400 }
            );
        }

        console.log("✅ Signing URL generated:", viewResult.url);
        return NextResponse.json({ url: viewResult.url });
    } catch (err) {
        console.error("🔥 DocuSign signingUrl error:", err);
        return NextResponse.json(
            { error: "DocuSign signingUrl failed", details: String(err) },
            { status: 500 }
        );
    }
}