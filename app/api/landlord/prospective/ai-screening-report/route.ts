import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });
    }

    try {
        // 1️⃣ Fetch rental and payment history from your backend
        const [rentalRes, paymentRes] = await Promise.all([
            axios.get(`${process.env.BASE_URL}/api/tenant/profile/scoring/rentalHistory?tenant_id=${tenant_id}`),
            axios.get(`${process.env.BASE_URL}/api/tenant/profile/scoring/paymentHistory?tenant_id=${tenant_id}`),
        ]);

        const rentalData = rentalRes.data || [];
        const paymentData = paymentRes.data || [];

        // 2️⃣ Construct the AI prompt
        const prompt = `
You are an expert tenant screening analyst. 
You will receive a tenant's rental and payment history data. 
Analyze and output normalized percentage scores (0–100) in JSON.

Criteria:
- Rental History: Evaluate frequency, consistency, and any missed leases.
- Payment History: Evaluate timeliness, consistency, and overdue patterns.
- Provide a final overall reliability score (weighted average).

Output format (strict JSON, no markdown or code block):
{
  "rental_history_score": number,
  "payment_history_score": number,
  "overall_score": number,
  "summary": string
}

Rental History Data: ${JSON.stringify(rentalData, null, 2)}
Payment History Data: ${JSON.stringify(paymentData, null, 2)}
`;

        const aiResponse = await axios.post(
            OPENROUTER_URL,
            {
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                },
            }
        );

        // 4️⃣ Sanitize and parse model output
        let raw = aiResponse.data?.choices?.[0]?.message?.content?.trim() || "{}";

        // Remove code fences and language hints
        raw = raw
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/^[^\{]*?(\{)/, "$1") // remove junk before first {
            .replace(/(\})[^\}]*$/, "$1"); // remove junk after last }

        let scores: any;
        try {
            scores = JSON.parse(raw);
        } catch (err) {
            console.warn("⚠️ Could not parse AI JSON, fallback to defaults:", raw);
            scores = {
                rental_history_score: 70,
                payment_history_score: 75,
                overall_score: 73,
                summary: "Default fallback: AI output could not be parsed correctly.",
            };
        }

        // 5️⃣ Return cleaned structured result
        return NextResponse.json({
            tenant_id,
            rental_history_score: scores.rental_history_score,
            payment_history_score: scores.payment_history_score,
            overall_score: scores.overall_score,
            summary: scores.summary,
        });
    } catch (err: any) {
        console.error("❌ AI scoring error:", err.response?.data || err.message);
        return NextResponse.json(
            { error: "Failed to generate AI-based score" },
            { status: 500 }
        );
    }
}
