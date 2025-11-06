
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // your DB instance

export async function POST(req: NextRequest) {
    try {
        const xml = await req.text(); // DocuSign sends XML by default
        console.log("Webhook payload:", xml);

        // ✅ parse XML → JSON
        const parsed = await parseXml(xml);

        const envelopeId = parsed?.DocuSignEnvelopeInformation?.EnvelopeStatus?.EnvelopeID?.[0];
        const status = parsed?.DocuSignEnvelopeInformation?.EnvelopeStatus?.Status?.[0];

        console.log("Envelope:", envelopeId, "Status:", status);

        // 🔹 update your database
        if (envelopeId && status) {
            await db.query(
                "UPDATE LeaseAgreement SET status = ? WHERE envelope_id = ?",
                [status, envelopeId]
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Webhook error:", err);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}

async function parseXml(xml: string) {
    const { parseStringPromise } = await import("xml2js");
    return parseStringPromise(xml, { explicitArray: true });
}
