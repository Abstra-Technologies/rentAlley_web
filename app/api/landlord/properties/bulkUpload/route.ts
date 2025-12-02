import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUnitId } from "@/utils/id_generator";
import * as XLSX from "xlsx";

const OPENROUTER_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;

// ------------------------------
// BULK UPLOAD API (AI Powered)
// ------------------------------
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const property_id = formData.get("property_id") as string;
        const file = formData.get("file") as File | null;

        if (!property_id || !file) {
            return NextResponse.json(
                { error: "property_id and file are required" },
                { status: 400 }
            );
        }

        // 1️⃣ Parse Excel/CSV → JSON
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet);

        const rawText = JSON.stringify(rawRows);

        // 2️⃣ Send to OpenRouter for AI extraction
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "arcee-ai/trinity-mini:free",
                max_tokens: 4096,
                messages: [
                    {
                        role: "system",
                        content: `
Extract unit data from spreadsheet rows. Return a JSON array only.

Each item MUST follow this structure:

{
  "unit_name": "",
  "unit_size": "",
  "rent_amount": 0,
  "furnish": "",
  "amenities": "",
  "status": "unoccupied",
  "unit_type": ""
}

- If a field is missing, leave it as empty string or 0.
- Do NOT include extra fields.
- Output pure JSON only (no text).`
                    },
                    {
                        role: "user",
                        content: rawText
                    }
                ]
            })
        });

        const aiJson = await aiResponse.json();
        const parsed = aiJson.choices?.[0]?.message?.content;

        if (!parsed) throw new Error("Invalid AI response");

        let units: any[] = [];
        try {
            units = JSON.parse(parsed);
        } catch (e) {
            console.error("AI JSON parse error:", parsed);
            throw new Error("AI returned invalid JSON");
        }

        if (!Array.isArray(units)) {
            throw new Error("AI output must be an array");
        }

        // 3️⃣ Insert units into DB (NO image logic)
        const connection = await db.getConnection();
        await connection.beginTransaction();

        for (const unit of units) {
            const {
                unit_name,
                unit_size,
                rent_amount,
                furnish,
                amenities,
                status,
                unit_type,
            } = unit;

            // generate unique ID
            let unit_id = generateUnitId();
            let unique = false;

            while (!unique) {
                const [rows]: any = await connection.query(
                    `SELECT unit_id FROM Unit WHERE unit_id = ?`,
                    [unit_id]
                );
                if (rows.length === 0) unique = true;
                else unit_id = generateUnitId();
            }

            await connection.execute(
                `INSERT INTO Unit
                (unit_id, property_id, unit_name, unit_size, rent_amount, furnish, amenities, status, unit_style)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    unit_id,
                    property_id,
                    unit_name || "",
                    unit_size || "",
                    rent_amount || 0,
                    furnish || "",
                    amenities || "",
                    status || "unoccupied",
                    unit_type || "",
                ]
            );
        }

        await connection.commit();
        connection.release();

        return NextResponse.json(
            {
                message: "Bulk import completed successfully",
                units_created: units.length,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Bulk Upload Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process bulk upload" },
            { status: 500 }
        );
    }
}
