import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        /* -----------------------------------------------------
           1️⃣ Resolve Tenant ID (if user_id provided)
        ----------------------------------------------------- */
        let tenantId: number | null = null;

        if (userId) {
            const [tenant]: any = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
                [userId]
            );
            tenantId = tenant[0]?.tenant_id || null;
        }

        /* -----------------------------------------------------
           2️⃣ Resolve latest lease agreement
        ----------------------------------------------------- */
        if (!agreementId && tenantId) {
            const [agreements]: any = await db.query(
                `
                SELECT agreement_id
                FROM LeaseAgreement
                WHERE tenant_id = ?
                ORDER BY start_date DESC
                LIMIT 1
                `,
                [tenantId]
            );
            agreementId = agreements[0]?.agreement_id || null;
        }

        if (!agreementId) {
            return NextResponse.json(
                { message: "Missing agreement_id or user_id." },
                { status: 400 }
            );
        }

        /* -----------------------------------------------------
           3️⃣ Fetch Lease + Unit + Property
        ----------------------------------------------------- */
        const [leaseInfo]: any = await db.query(
            `
            SELECT
                l.agreement_id,
                l.unit_id,
                l.rent_amount AS lease_rent_amount,
                u.unit_name,
                u.property_id,
                u.rent_amount AS unit_rent_amount,
                p.water_billing_type,
                p.electricity_billing_type
            FROM LeaseAgreement l
            JOIN Unit u ON l.unit_id = u.unit_id
            JOIN Property p ON u.property_id = p.property_id
            WHERE l.agreement_id = ?
            LIMIT 1
            `,
            [agreementId]
        );

        if (!leaseInfo.length) {
            return NextResponse.json({ message: "Lease not found." }, { status: 404 });
        }

        const {
            unit_id,
            property_id,
            unit_name,
            lease_rent_amount,
            unit_rent_amount,
            water_billing_type,
            electricity_billing_type
        } = leaseInfo[0];

        /* -----------------------------------------------------
           4️⃣ Compute Base Rent
        ----------------------------------------------------- */
        let baseRent = Number(lease_rent_amount || 0);
        if (!baseRent || baseRent <= 0)
            baseRent = Number(unit_rent_amount || 0);

        /* -----------------------------------------------------
           5️⃣ Property Configuration
        ----------------------------------------------------- */
        const [cfg]: any = await db.query(
            `
            SELECT billingReminderDay, billingDueDay, lateFeeType,
                   lateFeeAmount, gracePeriodDays
            FROM PropertyConfiguration
            WHERE property_id = ?
            LIMIT 1
            `,
            [property_id]
        );
        const propertyConfig = cfg[0] || null;

        /* -----------------------------------------------------
           6️⃣ Fetch LATEST concessionaire billing cycle
        ----------------------------------------------------- */
        const [conRows]: any = await db.query(
            `
            SELECT *
            FROM ConcessionaireBilling
            WHERE property_id = ?
            ORDER BY period_end DESC
            LIMIT 1
            `,
            [property_id]
        );

        const concessionaire = conRows[0] || null;

        const waterRate = concessionaire?.water_consumption
            ? concessionaire.water_total / concessionaire.water_consumption
            : 0;

        const electricityRate = concessionaire?.electricity_consumption
            ? concessionaire.electricity_total / concessionaire.electricity_consumption
            : 0;

        const cycle_start = concessionaire?.period_start || null;
        const cycle_end = concessionaire?.period_end || null;

        /* -----------------------------------------------------
           7️⃣ Fetch Billing for current MONTH
        ----------------------------------------------------- */
        const [billingRows]: any = await db.query(
            `
            SELECT *
            FROM Billing
            WHERE unit_id = ?
              AND MONTH(billing_period) = MONTH(CURRENT_DATE())
              AND YEAR(billing_period) = YEAR(CURRENT_DATE())
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [unit_id]
        );
        const billing = billingRows[0] || null;

        /* -----------------------------------------------------
           8️⃣ Fetch Water Reading for latest concessionaire period
        ----------------------------------------------------- */
        const [waterReading]: any = await db.query(
            `
            SELECT *
            FROM WaterMeterReading
            WHERE unit_id = ?
              AND concessionaire_bill_id = ?
            LIMIT 1
            `,
            [unit_id, concessionaire?.bill_id || 0]
        );

        /* -----------------------------------------------------
           9️⃣ Fetch Electric Reading for latest concessionaire period
        ----------------------------------------------------- */
        const [electricReading]: any = await db.query(
            `
            SELECT *
            FROM ElectricMeterReading
            WHERE unit_id = ?
              AND concessionaire_bill_id = ?
            LIMIT 1
            `,
            [unit_id, concessionaire?.bill_id || 0]
        );

        /* -----------------------------------------------------
           🔟 Additional Billing Charges
        ----------------------------------------------------- */
        let billingAdditionalCharges: any[] = [];
        if (billing) {
            const [charges]: any = await db.query(
                `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ?`,
                [billing.billing_id]
            );
            billingAdditionalCharges = charges;
        }

        /* -----------------------------------------------------
           1️⃣1️⃣ Lease Additional Expenses
        ----------------------------------------------------- */
        const [leaseExpenses]: any = await db.query(
            `
            SELECT *
            FROM LeaseAdditionalExpense
            WHERE agreement_id = ?
            `,
            [agreementId]
        );

        /* -----------------------------------------------------
           1️⃣2️⃣ PDC for current month
        ----------------------------------------------------- */
        const [pdcRows]: any = await db.query(
            `
            SELECT *
            FROM PostDatedCheck
            WHERE lease_id = ?
              AND MONTH(due_date) = MONTH(CURRENT_DATE())
              AND YEAR(due_date) = YEAR(CURRENT_DATE())
            ORDER BY due_date ASC
            `,
            [agreementId]
        );

        const paymentProcessing = pdcRows.some((pdc: any) =>
            ["pending", "processing"].includes(pdc.status)
        );

        /* -----------------------------------------------------
           1️⃣3️⃣ Build Final Response
        ----------------------------------------------------- */

        const response = {
            billing: billing
                ? {
                    ...billing,
                    unit_name,
                    total_amount_due: Number(billing.total_amount_due || 0),
                    payment_status: billing.payment_status || "unpaid",
                }
                : null,

            utilities: {
                water: {
                    enabled: water_billing_type === "submetered",
                    prev: waterReading?.previous_reading || null,
                    curr: waterReading?.current_reading || null,
                    consumption: waterReading?.consumption || null,
                    reading_date: waterReading?.reading_date || null,
                    rate: waterRate,
                    total: billing?.total_water_amount || 0,
                    cycle_start,
                    cycle_end
                },
                electricity: {
                    enabled: electricity_billing_type === "submetered",
                    prev: electricReading?.previous_reading || null,
                    curr: electricReading?.current_reading || null,
                    consumption: electricReading?.consumption || null,
                    reading_date: electricReading?.reading_date || null,
                    rate: electricityRate,
                    total: billing?.total_electricity_amount || 0,
                    cycle_start,
                    cycle_end
                }
            },

            billingAdditionalCharges,
            leaseAdditionalExpenses: leaseExpenses,
            postDatedChecks: pdcRows,
            paymentProcessing,

            breakdown: {
                base_rent: baseRent,
                water_total: billing?.total_water_amount || 0,
                electricity_total: billing?.total_electricity_amount || 0,
                total_before_late_fee: billing?.total_amount_due || baseRent,
            },

            propertyConfig,
            concessionaire_period: {
                period_start: cycle_start,
                period_end: cycle_end
            }
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error("❌ Tenant Billing Fetch Error:", error);
        return NextResponse.json(
            { message: "Server error", error: error.message },
            { status: 500 }
        );
    }
}
