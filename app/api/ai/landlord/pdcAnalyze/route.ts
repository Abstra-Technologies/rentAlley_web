import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { image_url } = await req.json();

        console.log("🖼️ Received S3 image URL:", image_url);

        if (!image_url) {
            return NextResponse.json(
                { error: "Image URL is required." },
                { status: 400 }
            );
        }

        // ✅ Prepare image input for OpenRouter
        const imageInput = {
            type: "image_url",
            image_url,
        };

        // 🔑 Call OpenRouter AI
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a Philippine banking document analysis assistant that checks PDC (post-dated check) images for clarity, compliance, and technical defects.",
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `
Analyze this Philippine post-dated check image for clarity, legibility, and compliance based on official clearing standards.

When evaluating, assign a **legibility_score (0.0–1.0)** using this weighted scoring system:

| Category | Weight | Description |
|-----------|--------|-------------|
| Handwriting clarity and readability | 0.25 | How clearly the text, numbers, and signatures can be read. |
| Issue Date format (MM-DD-YYYY) | 0.20 | Must be exactly formatted; non-standard (e.g., "5 Nov 2025") loses points. |
| Payee Line validity | 0.20 | Full name, entity name, or "Cash" only. Any "and/or Cash" combination loses full credit. |
| Amount in figures | 0.15 | Proper commas, decimal points, and symbols. |
| Amount in words | 0.20 | Must match numeric amount; valid forms follow official PESOS examples. |

Compute the score as the **sum of all rule weights that pass**, rounded to two decimal places.

---

### Rules to apply:

#### 1️⃣ Issue Date (Label may appear as "Date" or "DATE")
- Must follow **MM-DD-YYYY** or **MM/DD/YYYY** format.
- If written differently (e.g., 5 Nov 2025 or November 5, 2025), flag as non-compliant and **deduct 0.2**.
- Ensure the label "Date" or "DATE" is properly filled, not blank.

#### 2️⃣ Payee Line (Recipient)
- Allowed: Full name, business name, or "Cash".
- ❌ Not Allowed: any combination with "and/or Cash".
- "&" is acceptable but reduces clarity slightly.

#### 3️⃣ Amount in Figures
- Acceptable: 10,000.00, ***10,000***, 10,000---.
- ❌ Invalid: multiple decimals, missing commas, no decimals with centavos.

#### 4️⃣ Amount in Words (must match figures)
**Whole Amount:**
- PESOS ***Ten Thousand Only***
- PESOS Ten Thousand Pesos Only

**With Centavos:**
- PESOS Ten Thousand and 25 Centavos
- PESOS Ten Thousand Pesos and 25/100
- PESOS ***Ten Thousand and 25/100 Centavos***

### Check Number
- May be labeled **"Check No."**, **"Check #"**, **"Chk No."**, or **"No."**.
- Must contain numeric/alphanumeric characters.
- If missing, add issue “no check number detected” and deduct 0.1.

### Bank Name
- Usually printed top-left or bottom-left.
- If undetected, add issue “bank name not detected”.

---

### Output Format
Return **ONLY valid JSON** with:
{
  "legibility_score": 0-1,
  "confidence": "High" | "Moderate" | "Low",
  "issues": [...],
  "recommendation": "...",
  "bank_name": "...",
  "check_number": "...",
  "issue_date": "MM-DD-YYYY or MM/DD/YYYY",
  "amount": "numeric value",
  "amount_in_words": "...",
  "payee_name": "..."
}

Confidence:
- High → ≥ 0.85  
- Moderate → 0.70 – 0.84  
- Low → < 0.70
                `,
                            },
                            imageInput, // ✅ pass S3 image URL here
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("OpenRouter error:", errText);
            return NextResponse.json({ error: "Failed to call AI model." }, { status: 500 });
        }

        const data = await response.json();
        const aiContent = data?.choices?.[0]?.message?.content;
        console.log("AI raw content:", aiContent);

        // ✅ Extract and parse JSON safely
        const jsonMatch = aiContent?.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        // ✅ Normalize output
        const score = parsed.legibility_score ?? 0;
        const result = {
            legibility_score: score,
            confidence:
                parsed.confidence ??
                (score >= 0.85 ? "High" : score >= 0.7 ? "Moderate" : "Low"),
            issues: parsed.issues ?? [],
            recommendation: parsed.recommendation ?? "No major issues detected.",
            bank_name: parsed.bank_name || "",
            check_number: parsed.check_number || "",
            issue_date: parsed.issue_date || "",
            amount: parsed.amount || "",
            amount_in_words: parsed.amount_in_words || "",
            payee_name: parsed.payee_name || "",
        };

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("AI check analysis error:", err);
        return NextResponse.json(
            { error: "AI analysis failed. Please try again later." },
            { status: 500 }
        );
    }
}
