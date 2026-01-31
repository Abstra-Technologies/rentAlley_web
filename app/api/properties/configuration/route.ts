import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/* ============================
   GET — Fetch Configuration
============================ */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get("id");

        if (!propertyId) {
            return NextResponse.json(
                { error: "Missing property ID" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.query(
            `
      SELECT
          p.property_id,
          p.property_name,
          p.property_type,
          p.water_billing_type,
          p.electricity_billing_type,

          pc.billingReminderDay,
          pc.billingDueDay,
          pc.notifyEmail,
          pc.notifySms,
          pc.lateFeeType,
          pc.lateFeeFrequency,
          pc.lateFeeAmount,
          pc.gracePeriodDays,
          pc.createdAt,
          pc.updatedAt
      FROM Property p
      LEFT JOIN PropertyConfiguration pc
        ON p.property_id = pc.property_id
      WHERE p.property_id = ?
      LIMIT 1
      `,
            [propertyId]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({});
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("GET property configuration error:", error);
        return NextResponse.json(
            { error: "Failed to fetch property configuration" },
            { status: 500 }
        );
    }
}


/* ============================
   POST — Save / Update Config
============================ */
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();

    try {
        const {
            property_id,
            billingReminderDay,
            billingDueDay,
            notifyEmail,
            notifySms,
            lateFeeType,
            lateFeeFrequency,
            lateFeeAmount,
            gracePeriodDays,
            water_billing_type,
            electricity_billing_type,
        } = await req.json();

        if (!property_id) {
            return NextResponse.json(
                { error: "Property ID is required" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        /* ============================
           RULE 1: BLOCK IF BILLED
        ============================ */
        const [billingRows]: any = await connection.query(
            `
      SELECT 1
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      WHERE u.property_id = ?
        AND DATE_FORMAT(b.billing_period, '%Y-%m')
            = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
      LIMIT 1
      `,
            [property_id]
        );

        if (billingRows.length > 0) {
            await connection.rollback();
            return NextResponse.json(
                {
                    error:
                        "Configuration cannot be modified because billing is already generated for the current month.",
                },
                { status: 409 }
            );
        }

        /* ============================
           STEP 1: UPDATE PROPERTY
        ============================ */
        await connection.query(
            `
      UPDATE Property
      SET
        water_billing_type = ?,
        electricity_billing_type = ?,
        updated_at = NOW()
      WHERE property_id = ?
      `,
            [water_billing_type, electricity_billing_type, property_id]
        );

        /* ============================
           STEP 2: UPSERT CONFIG
        ============================ */
        const [existing]: any = await connection.query(
            `
      SELECT config_id
      FROM PropertyConfiguration
      WHERE property_id = ?
      LIMIT 1
      `,
            [property_id]
        );

        if (existing.length > 0) {
            // 🟠 UPDATE (idempotent)
            await connection.query(
                `
        UPDATE PropertyConfiguration
        SET
          billingReminderDay = ?,
          billingDueDay = ?,
          notifyEmail = ?,
          notifySms = ?,
          lateFeeType = ?,
          lateFeeFrequency = ?,
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
                    lateFeeFrequency ?? null,
                    lateFeeAmount,
                    gracePeriodDays,
                    property_id,
                ]
            );
        } else {
            // 🟢 INSERT
            await connection.query(
                `
        INSERT INTO PropertyConfiguration (
          config_id,
          property_id,
          billingReminderDay,
          billingDueDay,
          notifyEmail,
          notifySms,
          lateFeeType,
          lateFeeFrequency,
          lateFeeAmount,
          gracePeriodDays
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    uuidv4(),
                    property_id,
                    billingReminderDay,
                    billingDueDay,
                    notifyEmail ? 1 : 0,
                    notifySms ? 1 : 0,
                    lateFeeType,
                    lateFeeFrequency ?? null,
                    lateFeeAmount,
                    gracePeriodDays,
                ]
            );
        }

        await connection.commit();

        return NextResponse.json({
            message: "Property configuration updated successfully",
        });
    } catch (error) {
        await connection.rollback();
        console.error("POST property configuration error:", error);

        return NextResponse.json(
            { error: "Failed to save property configuration" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
