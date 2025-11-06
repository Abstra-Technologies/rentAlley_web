import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { prompt, property_id } = await req.json();

        if (!prompt || !property_id) {
            return NextResponse.json(
                { error: "Missing prompt or property_id" },
                { status: 400 }
            );
        }

        const systemPrompt = `
You are a helpful real estate assistant that outputs only valid JSON arrays of units.

Each unit should include any of these keys:
unit_name, unit_size, unit_style, rent_amount, furnish, amenities.

Rules:
- Always return a JSON array.
- Do not include any explanation or text outside the array.
- Do not include a "status" field — the system will set it to "unoccupied" automatically.
`;


        // 🧠 Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                ],
            }),
        });

        const data = await response.json();
        console.log("🧩 Raw AI response:", JSON.stringify(data, null, 2));

        // ✅ Support multiple possible response formats
        const content =
            data?.choices?.[0]?.message?.content?.trim() ??
            data?.choices?.[0]?.text?.trim() ??
            data?.output_text?.trim() ??
            "";

        if (!content) {
            return NextResponse.json(
                { error: "No AI output received", raw: data },
                { status: 400 }
            );
        }

        // 🧹 Remove ```json wrappers
        const cleanContent = content.replace(/```json|```/g, "").trim();

        let units;
        try {
            units = JSON.parse(cleanContent);
        } catch (err) {
            console.error("❌ Invalid AI JSON:", cleanContent);
            return NextResponse.json(
                { error: "AI returned invalid JSON", raw: cleanContent },
                { status: 400 }
            );
        }

        if (!Array.isArray(units) || units.length === 0) {
            return NextResponse.json(
                { error: "No valid unit array returned", raw: units },
                { status: 400 }
            );
        }

        // 🏗️ Insert into DB
        for (const unit of units) {
            await db.execute(
                `INSERT INTO rentalley_db.Unit
                 (property_id, unit_name, unit_size, unit_style, rent_amount, furnish, amenities, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    property_id,
                    unit.unit_name || "Unnamed Unit",
                    unit.unit_size || 20,
                    unit.unit_style || "studio",
                    unit.rent_amount || 0,
                    unit.furnish || "Unfurnished",
                    unit.amenities || "",
                    unit.status || "unoccupied",
                ]
            );
        }

        return NextResponse.json({
            success: true,
            message: `${units.length} units successfully generated and inserted.`,
            units,
        });
    } catch (error: any) {
        console.error("🔥 AI Unit Generation Error:", error);
        return NextResponse.json(
            { error: "AI generation failed", details: error.message },
            { status: 500 }
        );
    }
}
