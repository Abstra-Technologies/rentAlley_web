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
        const unitId = (formData.get("agreement_id") as string | null)?.trim();

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

        // Extract text with pdf-extraction
        const parsed = await pdf(buffer);
        let text = parsed.text.trim();

        if (!text) {
            return NextResponse.json(
                { success: false, error: "No text extracted from PDF" },
                { status: 422 }
            );
        }

        // Limit size
        const MAX_CHARS = 10_000;
        if (text.length > MAX_CHARS) {
            text = text.slice(0, MAX_CHARS) + "\n\n[TRUNCATED]";
        }

        // 🧠 AI prompt — with synonyms for clarity
        const prompt = `
You are a lease analyzer. Extract the following fields and return strict JSON only.

IMPORTANT: "startDate" and "endDate" are REQUIRED. 
If no explicit date is found, infer from context (e.g., "12 months from signing" → approximate start and end).
Always return them as ISO 8601 format (YYYY-MM-DD).

- "tenantName" may also appear as "Lessee", "Renter", or "Tenant".
- "landlordName" may also appear as "Lessor", "Owner", or "Landlord".
- "propertyAddress" may be labeled "Premises", "Location", "Property Address".
- "startDate" may be labeled  "StartDate", "Start Date", "beginning', 'beginning at', 'starting', 'starting at'.
- "endDate" may be labeled  "EndDate", "End Date", 'ending at', 'ending', 'ending at'.
- "monthlyRent" may be labeled "Rent", "Monthly Rental Fee".
- "securityDeposit" may be labeled "Deposit", "Security Deposit".
- "advancePayment" may be labeled "Advance Rent", "Advance Payment".
- "billingDueDay" may appear as "Due Date", "Payment Day".
- "percentageIncrease" may be described as "Rent Increase", "Escalation", "% Increase".
- "paymentMethods" may include "cash", "bank transfer", "form of payment", "GCash", "check", "PayMaya", etc.
- "included" means utilities/services included in rent (e.g., water, electricity, internet).
- "excludedFees" are recurring fees NOT included in rent (e.g., HOA dues, parking, garbage).
- "renewalTerms" may be labeled "Renewal", "Extension", or "Renewal Option".
- "penalties" includes grace periods, late fees, or fines.
- "currency" should be the currency symbol or code (e.g., PHP, ₱, USD, $).
- "gracePeriod" may be labelled as 'days grace period', 'Grace Period', 'day grace period'.
- 'latePenaltyAmount' may be labeled "Late Fees", 'late fee'.
- "penalties" may include labels such as "bounced checks", "eviction notices", "returned payments", "dishonored check".


Return the result in this exact JSON structure:
{
  "tenantName": string|null,
  "landlordName": string|null,
  "propertyAddress": string|null,
  "startDate": string,     
  "endDate": string,  
  "monthlyRent": number|null,
  "securityDeposit": number|null,
  "advancePayment": number|null,
  "billingDueDay": number|null, 
  "percentageIncrease": number|null, 
  "paymentMethods": string[]|null,
  "included": string[]|null,
  "excludedFees": { key: string, amount: number|null }[]|null,
  "renewalTerms": string|null,
  "penalties": string|null,
  "currency": string|null,
  "gracePeriod": number|null,
  "latePenaltyAmount": number|null,
    "penalties": { type: string, amount: number|null }[]|null

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
                model: "x-ai/grok-4-fast:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a precise JSON extractor for lease agreements. Respond with strict JSON only.",
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
