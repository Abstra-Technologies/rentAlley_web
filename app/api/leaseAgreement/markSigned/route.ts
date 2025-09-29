
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { envelopeId } = await req.json();

        if (!envelopeId) {
            return NextResponse.json(
                { error: "Missing envelopeId" },
                { status: 400 }
            );
        }

        // Update LeaseAgreement status to completed
        const [result] = await db.execute(
            "UPDATE LeaseAgreement SET status = ? WHERE docusign_envelope_id = ?",
            ["completed", envelopeId]
        );

        // Optional: check if any rows were updated
        // @ts-ignore
        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "No lease found for this envelopeId" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("🔥 Error in markSigned:", err);
        return NextResponse.json(
            { error: "Failed to mark lease as signed", details: String(err) },
            { status: 500 }
        );
    }
}
