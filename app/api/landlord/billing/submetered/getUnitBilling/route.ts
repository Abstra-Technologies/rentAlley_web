import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

function firstDayOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function lastDayOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function ymd(date: Date | string | null) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");

    if (!unit_id) {
        return NextResponse.json({ error: "Missing unit_id" }, { status: 400 });
    }

    try {
        // 1) Unit + Property
        const [unitRows] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM Unit WHERE unit_id = ?",
            [unit_id]
        );
        if (unitRows.length === 0) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }
        const unit = unitRows[0];

        const [propertyRows] = await db.execute<RowDataPacket[]>(
            "SELECT * FROM Property WHERE property_id = ?",
            [unit.property_id]
        );
        const property = propertyRows[0];

        // 2) Config (always use property config for due day)
        const [configRows] = await db.execute<RowDataPacket[]>(
            "SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1",
            [unit.property_id]
        );
        const billingDueDay: number = configRows[0]?.billingDueDay ?? 30;

        console.log("property billingDueDay:", billingDueDay);

        // Helpers for readings
        const getReadingForMonth = async (
            utility: "water" | "electricity",
            monthDate: Date
        ) => {
            const [rows] = await db.execute<RowDataPacket[]>(
                `
                    SELECT reading_id, unit_id, utility_type, reading_date, previous_reading, current_reading
                    FROM MeterReading
                    WHERE unit_id = ?
                      AND utility_type = ?
                      AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
                    ORDER BY reading_date DESC
                    LIMIT 1
                `,
                [unit_id, utility, ymd(monthDate)]
            );
            return rows[0] ?? null;
        };

        const getPrevReadingValue = async (
            utility: "water" | "electricity",
            monthDate: Date
        ) => {
            const [prevMonthRow] = await db.execute<RowDataPacket[]>(
                `
                    SELECT current_reading
                    FROM MeterReading
                    WHERE unit_id = ?
                      AND utility_type = ?
                      AND DATE_FORMAT(reading_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(?, INTERVAL 1 MONTH), '%Y-%m')
                    ORDER BY reading_date DESC
                    LIMIT 1
                `,
                [unit_id, utility, ymd(monthDate)]
            );

            if (prevMonthRow.length > 0) return prevMonthRow[0].current_reading;

            const [beforeRow] = await db.execute<RowDataPacket[]>(
                `
                    SELECT current_reading
                    FROM MeterReading
                    WHERE unit_id = ?
                      AND utility_type = ?
                      AND reading_date < DATE_FORMAT(?, '%Y-%m-01')
                    ORDER BY reading_date DESC
                    LIMIT 1
                `,
                [unit_id, utility, ymd(monthDate)]
            );

            return beforeRow.length > 0 ? beforeRow[0].current_reading : null;
        };

        // Target is current month
        const today = new Date();
        const monthStart = firstDayOfMonth(today);
        const monthEnd = lastDayOfMonth(today);

        // 3) Look up any billing for this month (for charges only)
        const [billingRows] = await db.execute<RowDataPacket[]>(
            `
                SELECT *
                FROM Billing
                WHERE unit_id = ?
                  AND billing_period BETWEEN ? AND ?
                LIMIT 1
            `,
            [unit_id, ymd(monthStart), ymd(monthEnd)]
        );

        let additional: any[] = [];
        let discounts: any[] = [];
        let billing_id: number | null = null;
        let billing_period: string | null = null;
        let total_amount_due: number | null = null;

        if (billingRows.length > 0) {
            const billing = billingRows[0];
            billing_id = billing.billing_id;
            billing_period = ymd(billing.billing_period);
            total_amount_due = billing.total_amount_due;

            const [charges] = await db.execute<RowDataPacket[]>(
                `
                    SELECT id, charge_category, charge_type, amount
                    FROM BillingAdditionalCharge
                    WHERE billing_id = ?
                `,
                [billing_id]
            );

            additional = charges.filter(
                (c: any) => c.charge_category === "additional"
            );
            discounts = charges.filter((c: any) => c.charge_category === "discount");
        }

        // 4) Readings (independent of billing)
        const waterCurr = await getReadingForMonth("water", today);
        const elecCurr = await getReadingForMonth("electricity", today);

        const waterPrevValue = await getPrevReadingValue("water", today);
        const elecPrevValue = await getPrevReadingValue("electricity", today);

        const water_prev =
            waterPrevValue ?? (waterCurr ? waterCurr.previous_reading : null);
        const water_curr = waterCurr ? waterCurr.current_reading : null;

        const elec_prev =
            elecPrevValue ?? (elecCurr ? elecCurr.previous_reading : null);
        const elec_curr = elecCurr ? elecCurr.current_reading : null;

        // Reading date (for info only)
        const readingDateForDue =
            (waterCurr && waterCurr.reading_date) ||
            (elecCurr && elecCurr.reading_date) ||
            null;

        // 5) Adjusted: Compute due date strictly from billingDueDay number (1–31)
        const refDate = readingDateForDue ? new Date(readingDateForDue) : today;
        const year = refDate.getFullYear();
        const month = refDate.getMonth();

        // ensure the day doesn’t exceed the actual number of days in this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const safeDay = Math.min(Math.max(1, billingDueDay), daysInMonth);
        const computedDueDate = ymd(new Date(year, month, safeDay));

        // Compose response object
        const existingBilling = {
            billing_id,
            billing_period: billing_period ?? ymd(monthStart),
            due_date: computedDueDate,
            total_amount_due,
            reading_date: ymd(readingDateForDue),
            water_prev: water_prev ?? null,
            water_curr: water_curr ?? null,
            elec_prev: elec_prev ?? null,
            elec_curr: elec_curr ?? null,
            additional_charges: additional.map((c) => ({
                id: c.id,
                charge_type: c.charge_type,
                amount: c.amount,
                charge_category: "additional",
            })),
            discounts: discounts.map((d) => ({
                id: d.id,
                charge_type: d.charge_type,
                amount: d.amount,
                charge_category: "discount",
            })),
        };

        return NextResponse.json(
            {
                unit,
                property,
                dueDate: existingBilling.due_date,
                existingBilling,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("DB Error:", error);
        return NextResponse.json({ error: "DB Server Error" }, { status: 500 });
    }
}
