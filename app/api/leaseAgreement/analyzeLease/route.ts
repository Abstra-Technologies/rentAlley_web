
// app/api/leaseAgreement/analyzeLease/route.ts
import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import pdf from "pdf-extraction";

export const runtime = "nodejs";

function safeParseJSON(text: string) {
    try {
        const cleaned = text
            .trim()
            .replace(/^```(?:json)?/i, "")
            .replace(/```$/, "");
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("leaseFile") as File | null;
        const unitId = (formData.get("unit_id") as string | null)?.trim();

        if (!file) {
            return NextResponse.json(
                { success: false, error: "Missing file" },
                { status: 400 }
            );
        }
        if (!unitId) {
            return NextResponse.json(
                { success: false, error: "Missing unit_id" },
                { status: 400 }
            );
        }

        // ✅ Convert uploaded file → Node Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Extract text with pdf-extraction (no worker issues)
        const parsed = await pdf(buffer);
        let text = parsed.text.trim();

        if (!text) {
            return NextResponse.json(
                { success: false, error: "No text extracted from PDF" },
                { status: 422 }
            );
        }

        // Limit characters to avoid AI token overload
        const MAX_CHARS = 50_000;
        if (text.length > MAX_CHARS) {
            text = text.slice(0, MAX_CHARS) + "\n\n[TRUNCATED]";
        }

        // 🧠 AI prompt
        const prompt = `
You are a lease analyzer. Extract the following fields and return strict JSON only:
{
  "tenantName": string|null,
  "landlordName": string|null,
  "propertyAddress": string|null,
  "startDate": string|null,
  "endDate": string|null,
  "monthlyRent": number|null,
  "securityDeposit": number|null,
  "renewalTerms": string|null,
  "penalties": string|null,
  "currency": string|null
}

Lease Document:
${text}
    `.trim();

        // 🔥 Call OpenRouter AI
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-r1:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a precise JSON extractor for lease agreements.",
                    },
                    { role: "user", content: prompt },
                ],
                temperature: 0,
            }),
        });

        const data = await aiRes.json();
        const raw = data?.choices?.[0]?.message?.content?.trim() || "";

        let analysis: any;
        try {
            const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "");
            analysis = JSON.parse(cleaned);
        } catch {
            analysis = { error: "Invalid AI response", raw };
        }

        return NextResponse.json({
            success: true,
            unitId,
            analysis,
            meta: {
                pages: parsed.numpages,
                textLength: text.length,
            },
        });
    } catch (err) {
        console.error("analyzeLease error:", err);
        return NextResponse.json(
            { success: false, error: "Lease analysis failed" },
            { status: 500 }
        );
    }
}
