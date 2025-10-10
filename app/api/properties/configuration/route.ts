import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// 🟢 GET - Fetch Property Configuration
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("id");

        if (!propertyId) {
            return NextResponse.json({ error: "Missing property ID" }, { status: 400 });
        }

        const [rows]: any = await db.query(
            "SELECT * FROM PropertyConfiguration WHERE property_id = ? LIMIT 1",
            [propertyId]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({});
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error("Error fetching property configuration:", error);
        return NextResponse.json(
            { error: "Failed to fetch property configuration" },
            { status: 500 }
        );
    }
}

// 🟣 POST - Save or Update Property Configuration
export async function POST(req: NextRequest) {
    try {
        const {
            property_id,
            billingReminderDay,
            billingDueDay,
            notifyEmail,
            notifySms,
        } = await req.json();

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        // Check if configuration exists
        const [existing]: any = await db.query(
            "SELECT * FROM PropertyConfiguration WHERE property_id = ? LIMIT 1",
            [property_id]
        );

        if (existing && existing.length > 0) {
            // 🟠 Update existing configuration
            await db.query(
                `UPDATE PropertyConfiguration
                 SET billingReminderDate = ?, billingDueDay = ?, notifyEmail = ?, notifySms = ?, updatedAt = NOW()
                 WHERE property_id = ?`,
                [billingReminderDay, billingDueDay, notifyEmail, notifySms, property_id]
            );
        } else {
            // 🟢 Insert new configuration
            await db.query(
                `INSERT INTO PropertyConfiguration
                 (config_id, property_id, billingReminderDate, billingDueDay, notifyEmail, notifySms)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), property_id, billingReminderDay, billingDueDay, notifyEmail, notifySms]
            );
        }

        return NextResponse.json({
            message: "Configuration saved successfully",
        });
    } catch (error: any) {
        console.error("Error saving property configuration:", error);
        return NextResponse.json(
            { error: "Failed to save property configuration" },
            { status: 500 }
        );
    }
}
