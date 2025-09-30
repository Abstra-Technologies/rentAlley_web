
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDocuSignToken } from "@/lib/docusignAuth";
import { decryptData } from "@/crypto/encrypt";

const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const { envelopeId } = await req.json();
        console.log("📩 Incoming request with envelopeId:", envelopeId);

        if (!envelopeId) {
            console.warn("⚠️ Missing envelopeId in request body");
            return NextResponse.json(
                { error: "Missing envelopeId" },
                { status: 400 }
            );
        }

        // 1️⃣ Get tenant’s user fields
        console.log("🔍 Querying DB for tenant by envelopeId:", envelopeId);
        const [rows]: any = await db.query(
            `SELECT u.email, u.firstName, u.lastName
             FROM LeaseAgreement la
                      JOIN Tenant t ON la.tenant_id = t.tenant_id
                      JOIN User u ON t.user_id = u.user_id
             WHERE la.docusign_envelope_id = ?`,
            [envelopeId]
        );

        console.log("📊 DB rows:", rows);

        if (!rows || rows.length === 0) {
            console.warn("⚠️ No tenant found for envelopeId:", envelopeId);
            return NextResponse.json(
                { error: "No tenant found for this envelope" },
                { status: 404 }
            );
        }

        // 2️⃣ Decrypt fields
        let tenantEmail: string;
        let tenantFirstName: string;
        let tenantLastName: string;

        try {
            console.log("🔐 Decrypting tenant data...");
            tenantEmail = await decryptData(
                JSON.parse(rows[0].email),
                encryptionSecret
            );
            tenantFirstName = await decryptData(
                JSON.parse(rows[0].firstName),
                encryptionSecret
            );
            tenantLastName = await decryptData(
                JSON.parse(rows[0].lastName),
                encryptionSecret
            );
            console.log("✅ Decrypted tenant:", {
                tenantEmail,
                tenantFirstName,
                tenantLastName,
            });
        } catch (err) {
            console.error("❌ Decryption error:", err);
            return NextResponse.json(
                { error: "Failed to decrypt tenant data" },
                { status: 500 }
            );
        }

        const tenantName = `${tenantFirstName} ${tenantLastName}`.trim();
        console.log("👤 Tenant name:", tenantName);

        // 3️⃣ Get DocuSign access token
        console.log("🔑 Fetching DocuSign token...");
        const { accessToken, accountId } = await getDocuSignToken();
        console.log("✅ Got DocuSign token. AccountId:", accountId);

        // 4️⃣ Build recipient view request
        const viewRequest = {
            returnUrl: `http://localhost:3000/pages/lease/signed?envelopeId=${envelopeId}`,
            authenticationMethod: "none",
            email: tenantEmail,
            userName: "Tenant",
            clientUserId: "1002", // tenant fixed ID
        };
        console.log("📝 Recipient view request:", viewRequest);

        // 5️⃣ Call DocuSign
        console.log("📡 Sending request to DocuSign API...");
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
            console.error("❌ Failed to generate tenant signing URL:", viewResult);
            return NextResponse.json(
                { error: "Failed to generate tenant signing URL", details: viewResult },
                { status: 400 }
            );
        }

        console.log("✅ Generated signing URL:", viewResult.url);
        return NextResponse.json({ url: viewResult.url });
    } catch (err: any) {
        console.error("❌ Error generating tenant signing URL:", err);
        return NextResponse.json(
            { error: "Internal server error", details: err.message },
            { status: 500 }
        );
    }
}

