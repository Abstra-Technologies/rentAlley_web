import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUnitId } from "@/utils/id_generator";
import { AMENITIES_LIST } from "@/constant/amenities";
import unitTypes from "@/constant/unitTypes";
import furnishingTypes from "@/constant/furnishingTypes";

// 🔍 Generate a unique unit_id by checking the database
async function getUniqueUnitId(): Promise<string> {
    let unitId = generateUnitId();
    let isDuplicate = true;

    while (isDuplicate) {
        const [rows]: any = await db.query(
            "SELECT unit_id FROM rentalley_db.Unit WHERE unit_id = ?",
            [unitId]
        );

        if (rows.length === 0) {
            isDuplicate = false; // ✅ unique
        } else {
            console.warn(`⚠️ Duplicate ID detected (${unitId}), regenerating...`);
            unitId = generateUnitId(); // 🔁 try again
        }
    }

    return unitId;
}

export async function POST(req: NextRequest) {
    try {
        const { prompt, property_id } = await req.json();

        if (!prompt || !property_id) {
            return NextResponse.json(
                { error: "Missing prompt or property_id" },
                { status: 400 }
            );
        }

        // 🧠 Build dynamic AI instruction using your constants
        const allowedUnitTypes = unitTypes.map((t) => t.value).join(", ");
        const allowedFurnishings = furnishingTypes
            .map((t) => t.label)
            .join(", ");
        const allowedAmenities = AMENITIES_LIST.join(", ");

        const systemPrompt = `
You are a real estate assistant that converts natural-language descriptions into structured unit data.

Your goal is to output ONLY a valid JSON array of unit objects, based on the user's input.

Each unit object must include:
- unit_name (string)
- unit_size (integer, optional)
- unit_style (string, one of: ${allowedUnitTypes})
- rent_amount (number, optional)
- furnish (string, one of: ${allowedFurnishings})
- amenities (comma-separated list of allowed amenities: ${allowedAmenities})

Rules:
- Always output a valid JSON array (e.g. [ { ... } ]).
- Do NOT include explanations, markdown, or text outside JSON.
- If the user says “add 1 unit 501” or “add 3 studio units”, handle accordingly.
- Default values:
  • unit_size = 20
  • unit_style = "1-bedroom"
  • rent_amount = 0
  • furnish = "Unfurnished"
  • amenities = ""
- Example output:

[
  {
    "unit_name": "501",
    "unit_style": "1-bedroom",
    "rent_amount": 12000,
    "furnish": "Fully Furnished",
    "amenities": "Aircon, TV, Refrigerator"
  }
]
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

        // 🧹 Clean and parse JSON
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

        // 🧾 Soft Validation using constants
        const allowedStyles = unitTypes.map((t) => t.value);
        const allowedFurnishLabels = furnishingTypes.map((t) => t.label.toLowerCase());

        const insertedUnits = [];

        for (const unit of units) {
            const unit_id = await getUniqueUnitId();

            // ✅ Validate & sanitize unit_style
            const style = allowedStyles.includes((unit.unit_style || "").toLowerCase())
                ? unit.unit_style
                : "others";

            // ✅ Validate & sanitize furnish
            let furnish = furnishingTypes.find(
                (f) =>
                    f.label.toLowerCase() === (unit.furnish || "").toLowerCase() ||
                    f.value === (unit.furnish || "").toLowerCase()
            )?.label || "Unfurnished";

            // ✅ Normalize amenities
            const normalizedAmenities = (unit.amenities || "")
                .split(/[,|]/)
                .map((a: string) => a.trim())
                .filter((a: string) => a !== "")
                .join(", ");

            await db.execute(
                `INSERT INTO rentalley_db.Unit
         (unit_id, property_id, unit_name, unit_size, unit_style, rent_amount, furnish, amenities, status, publish)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    unit_id,
                    property_id,
                    unit.unit_name || `Unit-${unit_id.slice(-3)}`,
                    unit.unit_size || 20,
                    style,
                    unit.rent_amount || 0,
                    furnish,
                    normalizedAmenities,
                    "unoccupied",
                    false, // unpublished by default
                ]
            );

            insertedUnits.push({ unit_id, ...unit });
        }

        return NextResponse.json({
            success: true,
            message: `${insertedUnits.length} units successfully generated and inserted.`,
            units: insertedUnits,
        });
    } catch (error: any) {
        console.error("🔥 AI Unit Generation Error:", error);
        return NextResponse.json(
            { error: "AI generation failed", details: error.message },
            { status: 500 }
        );
    }
}
