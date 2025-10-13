import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// 🟢 GET — Fetch Property + Configuration
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("id");

        if (!propertyId) {
            return NextResponse.json({ error: "Missing property ID" }, { status: 400 });
        }

        // ✅ Join Property and PropertyConfiguration
        const [rows]: any = await db.query(
            `
                SELECT
                    p.property_id,
                    p.property_name,
                    p.property_type,
                    p.water_billing_type,
                    p.elec_billing_type,
                    pc.billingReminderDay,
                    pc.billingDueDay,
                    pc.notifyEmail,
                    pc.notifySms,
                    pc.lateFeeType,
                    pc.lateFeeAmount,
                    pc.gracePeriodDays,
                    pc.createdAt,
                    pc.updatedAt
                FROM Property p
                         LEFT JOIN PropertyConfiguration pc ON p.property_id = pc.property_id
                WHERE p.property_id = ?
                LIMIT 1
            `,
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

// 🟣 POST — Save / Update Configuration + Property Utility Types
export async function POST(req: NextRequest) {
    try {
        const {
            property_id,
            billingReminderDay,
            billingDueDay,
            notifyEmail,
            notifySms,
            lateFeeType,
            lateFeeAmount,
            gracePeriodDays,
            water_billing_type,
            elec_billing_type,
        } = await req.json();

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        // 🧱 Step 1: Update utility types in Property table
        await db.query(
            `
            UPDATE Property 
            SET water_billing_type = ?, electricity_billing_type = ?, updated_at = NOW()
            WHERE property_id = ?
            `,
            [water_billing_type, elec_billing_type, property_id]
        );

        // 🧱 Step 2: Update or insert configuration in PropertyConfiguration
        const [existing]: any = await db.query(
            "SELECT config_id FROM PropertyConfiguration WHERE property_id = ? LIMIT 1",
            [property_id]
        );

        if (existing && existing.length > 0) {
            // 🟠 Update configuration
            await db.query(
                `
                    UPDATE PropertyConfiguration
                    SET
                        billingReminderDay = ?,
                        billingDueDay = ?,
                        notifyEmail = ?,
                        notifySms = ?,
                        lateFeeType = ?,
                        lateFeeAmount = ?,
                        gracePeriodDays = ?,
                        updatedAt = NOW()
                    WHERE property_id = ?
                `,
                [
                    billingReminderDay,
                    billingDueDay,
                    notifyEmail ? 1 : 0,
                    notifySms ? 1 : 0,
                    lateFeeType,
                    lateFeeAmount,
                    gracePeriodDays,
                    property_id,
                ]
            );
        } else {
            // 🟢 Insert new configuration
            await db.query(
                `
                    INSERT INTO PropertyConfiguration
                    (
                        config_id,
                        property_id,
                        billingReminderDay,
                        billingDueDay,
                        notifyEmail,
                        notifySms,
                        lateFeeType,
                        lateFeeAmount,
                        gracePeriodDays
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    uuidv4(),
                    property_id,
                    billingReminderDay,
                    billingDueDay,
                    notifyEmail ? 1 : 0,
                    notifySms ? 1 : 0,
                    lateFeeType,
                    lateFeeAmount,
                    gracePeriodDays,
                ]
            );
        }

        return NextResponse.json({
            message: "Configuration and utility settings updated successfully",
        });
    } catch (error: any) {
        console.error("Error saving property configuration:", error);
        return NextResponse.json(
            { error: "Failed to save property configuration" },
            { status: 500 }
        );
    }
}
