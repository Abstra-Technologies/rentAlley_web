// app/api/landlord/properties/bulkUpload/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateUnitId } from "@/utils/id_generator";
import * as XLSX from "xlsx";
import pdfParse from "pdf-parse-new";
import mammoth from "mammoth";

const OPENROUTER_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;
const MODEL = process.env.OPENROUTER_UNIT_IMPORT_MODEL!;

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

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;

        let rawText = "";

        // ====================================================
        // 1️⃣ FILE TYPE HANDLING
        // ====================================================

        // Excel / CSV
        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            mimeType.includes("csv")
        ) {
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            rawText = JSON.stringify(rawRows);
        }

        // PDF (using pdf-parse-new)
        else if (mimeType === "application/pdf") {
            const pdfData = await pdfParse(buffer);
            rawText = pdfData.text;
        }

        // DOCX
        else if (
            mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            rawText = result.value;
        }

        else {
            return NextResponse.json(
                { error: "Unsupported file type" },
                { status: 400 }
            );
        }

        // ====================================================
        // 2️⃣ SEND TO OPENROUTER
        // ====================================================

        const aiResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${OPENROUTER_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: MODEL,
                    temperature: 0,
                    max_tokens: 4000,
                    messages: [
                        {
                            role: "system",
                            content: `
Extract rental unit data from the document.

Return ONLY a valid JSON array.
Do not include markdown.
Do not include explanation.

Each item MUST follow:

{
  "unit_name": "",
  "unit_size": "",
  "rent_amount": 0,
  "furnish": "",
  "amenities": "",
  "status": "unoccupied",
  "unit_type": ""
}
              `,
                        },
                        {
                            role: "user",
                            content: rawText,
                        },
                    ],
                }),
            }
        );

        const aiJson = await aiResponse.json();
        console.log("AI RESPONSE:", aiJson);

        if (!aiResponse.ok) {
            throw new Error(
                aiJson.error?.message || "OpenRouter request failed"
            );
        }

        if (!aiJson.choices || !aiJson.choices.length) {
            throw new Error("AI returned empty response");
        }

        let content = aiJson.choices[0].message.content;

        // Clean markdown wrapper if exists
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        let units: any[];

        try {
            units = JSON.parse(content);
        } catch {
            console.error("Invalid AI JSON:", content);
            throw new Error("AI returned invalid JSON");
        }

        if (!Array.isArray(units)) {
            throw new Error("AI output must be an array");
        }

        // ====================================================
        // 3️⃣ INSERT INTO DATABASE
        // ====================================================

        const connection = await db.getConnection();
        await connection.beginTransaction();

        const validStyles = [
            "studio",
            "1-bedroom",
            "2-bedroom",
            "3-bedroom",
            "loft",
            "duplex",
            "penthouse",
            "dorm",
            "others",
        ];

        const validStatus = [
            "occupied",
            "unoccupied",
            "inactive",
            "archived",
        ];

        for (const unit of units) {
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
                    unit.unit_name || "",
                    Number(unit.unit_size) || 0,
                    Number(unit.rent_amount) || 0,
                    unit.furnish || "",
                    unit.amenities || "",
                    validStatus.includes(unit.status)
                        ? unit.status
                        : "unoccupied",
                    validStyles.includes(unit.unit_type)
                        ? unit.unit_type
                        : "studio",
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
