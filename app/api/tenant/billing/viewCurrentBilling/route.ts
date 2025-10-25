import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        // 🧭 1. Resolve Tenant
        let tenantId: number | null = null;
        if (userId) {
            const [tenantRows]: any = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
                [userId]
            );
            tenantId = tenantRows[0]?.tenant_id || null;
        }

        // 🧾 2. Resolve Agreement
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
                { message: "Missing agreement_id or valid user_id." },
                { status: 400 }
            );
        }

        // 🏠 3. Lease, Unit, Property
        const [leaseRows]: any = await db.query(
            `
          SELECT
              l.unit_id,
              u.property_id,
              u.unit_name,
              u.rent_amount,
              p.water_billing_type,
              p.electricity_billing_type,
              p.advance_payment_months,
              l.advance_payment_amount,
              l.is_advance_payment_paid
          FROM LeaseAgreement l
                   JOIN Unit u ON l.unit_id = u.unit_id
                   JOIN Property p ON u.property_id = p.property_id
          WHERE l.agreement_id = ?
      `,
            [agreementId]
        );

        if (!leaseRows.length)
            return NextResponse.json(
                { message: "Lease agreement not found." },
                { status: 404 }
            );

        const {
            unit_id: unitId,
            property_id: propertyId,
            unit_name: unitName,
            rent_amount,
            water_billing_type,
            electricity_billing_type,
            advance_payment_months,
            advance_payment_amount,
            is_advance_payment_paid,
        } = leaseRows[0];

        const baseRent = parseFloat(rent_amount || 0);
        const totalAdvanceRequired =
            parseFloat(advance_payment_amount || 0) *
            parseInt(advance_payment_months || 0);

        // ⚙️ 4. Property Configuration
        const [configRows]: any = await db.query(
            `
          SELECT
              billingReminderDay,
              billingDueDay,
              notifyEmail,
              notifySms,
              lateFeeType,
              lateFeeAmount,
              gracePeriodDays
          FROM PropertyConfiguration
          WHERE property_id = ?
          LIMIT 1
      `,
            [propertyId]
        );
        const propertyConfig = configRows[0] || null;

        // 💡 5. Current Billing (if exists)
        const [billingRows]: any = await db.query(
            `
          SELECT *
          FROM Billing
          WHERE unit_id = ?
            AND MONTH(billing_period) = MONTH(CURRENT_DATE())
            AND YEAR(billing_period) = YEAR(CURRENT_DATE())
          LIMIT 1
      `,
            [unitId]
        );
        const billing = billingRows[0] || null;

        // 💳 6. PDC (Post-Dated Checks)
        const [pdcRows]: any = await db.query(
            `
          SELECT
              pdc_id,
              check_number,
              bank_name,
              amount,
              due_date,
              status,
              uploaded_image_url
          FROM PostDatedCheck
          WHERE lease_id = ?
            AND MONTH(due_date) = MONTH(CURRENT_DATE())
            AND YEAR(due_date) = YEAR(CURRENT_DATE())
          ORDER BY due_date ASC
      `,
            [agreementId]
        );

        // 🧮 Determine if any payment is still under processing
        const hasPendingPdc = pdcRows.some(
            (pdc: any) => ["pending", "processing"].includes(pdc.status)
        );
        const paymentProcessing = hasPendingPdc;

        // 🔌 8. Utility Readings (latest 2 per type)
        const [meterReadings]: any = await db.query(
            `
        SELECT *
        FROM MeterReading
        WHERE unit_id = ?
        ORDER BY utility_type, reading_date DESC
      `,
            [unitId]
        );
        const groupedReadings = { water: [], electricity: [] };
        for (const r of meterReadings) {
            if (r.utility_type === "water" && groupedReadings.water.length < 2)
                groupedReadings.water.push(r);
            if (
                r.utility_type === "electricity" &&
                groupedReadings.electricity.length < 2
            )
                groupedReadings.electricity.push(r);
        }

        // ➕ 9. Additional Charges
        let billingAdditionalCharges: any[] = [];
        if (billing) {
            const [charges]: any = await db.query(
                `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ?`,
                [billing.billing_id]
            );
            billingAdditionalCharges = charges;
        }

        // 🧾 10. Lease-Level Extra Expenses
        const [leaseExpenses]: any = await db.query(
            `SELECT * FROM LeaseAdditionalExpense WHERE agreement_id = ?`,
            [agreementId]
        );

        // 💧⚡ 11. Fetch latest Concessionaire Rates for property
        const [concessionaireRows]: any = await db.query(
            `
        SELECT
          water_total / NULLIF(water_consumption, 0) AS water_rate,
          electricity_total / NULLIF(electricity_consumption, 0) AS electricity_rate,
          billing_period
        FROM ConcessionaireBilling
        WHERE property_id = ?
        ORDER BY billing_period DESC
        LIMIT 1
      `,
            [propertyId]
        );
        const concessionaire = concessionaireRows[0] || {
            water_rate: 0,
            electricity_rate: 0,
        };

        // 🧮 12. Build breakdown
        const breakdown = {
            base_rent: baseRent,
            water: billing?.total_water_amount || 0,
            electricity: billing?.total_electricity_amount || 0,
            advance_payment_required: totalAdvanceRequired,
            advance_payment_amount: parseFloat(advance_payment_amount || 0),
            advance_months: advance_payment_months,
            is_advance_payment_paid: !!is_advance_payment_paid,
            total_before_late_fee: billing
                ? parseFloat(billing.total_amount_due || 0)
                : baseRent,
        };

        // 🧩 13. Assemble response
        const response = {
            billing: billing
                ? {
                    ...billing,
                    unit_name: unitName,
                    billing_period: billing.billing_period || new Date(),
                    total_amount_due: parseFloat(
                        billing.total_amount_due || 0
                    ).toFixed(2),
                }
                : {
                    billing_period: new Date(),
                    total_amount_due: baseRent.toFixed(2),
                    status: "unpaid",
                    unit_name: unitName,
                },
            meterReadings: groupedReadings,
            billingAdditionalCharges,
            leaseAdditionalExpenses: leaseExpenses,

            // 🔧 Combined billing types + concessionaire rates
            propertyBillingTypes: {
                water_billing_type,
                electricity_billing_type,
                water_rate: concessionaire.water_rate || 0,
                electricity_rate: concessionaire.electricity_rate || 0,
                billing_period: concessionaire.billing_period || null,
            },

            breakdown,
            propertyConfig,
            postDatedChecks: pdcRows,
            paymentProcessing,
        };
        console.log('response', response);

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("❌ Tenant Billing API error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
