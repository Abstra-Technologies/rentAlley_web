import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route GET /api/tenant/billing/viewCurrentBilling
 * @desc Fetch tenant’s current billing (rent + utilities + PDC + readings + payment proof)
 * @query agreement_id?, user_id?
 * @returns Detailed billing breakdown
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let agreementId = searchParams.get("agreement_id");
    const userId = searchParams.get("user_id");

    try {
        // 1️⃣ Resolve Tenant ID if user_id provided
        let tenantId: number | null = null;
        if (userId) {
            const [tenantRows]: any = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
                [userId]
            );
            tenantId = tenantRows[0]?.tenant_id || null;
        }

        // 2️⃣ Resolve latest active agreement if not directly provided
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

        // 3️⃣ Fetch Lease, Unit, and Property Info
        const [leaseRows]: any = await db.query(
            `
                SELECT
                    l.unit_id,
                    l.rent_amount AS lease_rent_amount,
                    u.property_id,
                    u.unit_name,
                    u.rent_amount AS unit_rent_amount,
                    p.water_billing_type,
                    p.electricity_billing_type,
                    p.advance_payment_months,
                    l.advance_payment_amount,
                    l.is_advance_payment_paid
                FROM LeaseAgreement l
                         JOIN Unit u ON l.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE l.agreement_id = ?
                LIMIT 1
            `,
            [agreementId]
        );

        if (!leaseRows.length) {
            return NextResponse.json(
                { message: "Lease agreement not found." },
                { status: 404 }
            );
        }

        const {
            unit_id: unitId,
            property_id: propertyId,
            unit_name: unitName,
            lease_rent_amount,
            unit_rent_amount,
            water_billing_type,
            electricity_billing_type,
            advance_payment_months,
            advance_payment_amount,
            is_advance_payment_paid,
        } = leaseRows[0];

        // 4️⃣ Compute base rent
        let baseRent = Number(lease_rent_amount || 0);
        if (!baseRent || baseRent <= 0) baseRent = Number(unit_rent_amount || 0);

        const totalAdvanceRequired =
            Number(advance_payment_amount || 0) * Number(advance_payment_months || 0);

        // 5️⃣ Fetch Property Config
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

        // 6️⃣ Current Billing + Linked Payment Proof
        const [billingRows]: any = await db.query(
            `
                SELECT
                    b.*,
                    p.payment_id,
                    p.payment_status,
                    p.proof_of_payment,
                    p.receipt_reference
                FROM Billing b
                         LEFT JOIN Payment p
                                   ON p.agreement_id = (
                                       SELECT agreement_id
                                       FROM LeaseAgreement
                                       WHERE unit_id = b.unit_id
                                       LIMIT 1
                                   )
                                       AND p.payment_type = 'billing'
                                       AND MONTH(p.created_at) = MONTH(CURRENT_DATE())
                                       AND YEAR(p.created_at) = YEAR(CURRENT_DATE())
                                       AND p.payment_status IN ('pending', 'processing', 'verifying')
                WHERE b.unit_id = ?
                  AND MONTH(b.billing_period) = MONTH(CURRENT_DATE())
                  AND YEAR(b.billing_period) = YEAR(CURRENT_DATE())
                ORDER BY b.created_at DESC
                LIMIT 1
            `,
            [unitId]
        );


        const billing = billingRows[0] || null;

        // 7️⃣ Post-Dated Checks
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

        const hasPendingPdc = pdcRows.some((pdc: any) =>
            ["pending", "processing"].includes(pdc.status)
        );
        const paymentProcessing = hasPendingPdc;

        // 8️⃣ Latest Utility Readings
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

        // 9️⃣ Additional Charges
        let billingAdditionalCharges: any[] = [];
        if (billing) {
            const [charges]: any = await db.query(
                `SELECT * FROM BillingAdditionalCharge WHERE billing_id = ?`,
                [billing.billing_id]
            );
            billingAdditionalCharges = charges;
        }

        // 🔟 Lease-Level Additional Expenses
        const [leaseExpenses]: any = await db.query(
            `SELECT * FROM LeaseAdditionalExpense WHERE agreement_id = ?`,
            [agreementId]
        );

        // 1️⃣1️⃣ Latest Concessionaire Rates
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

        // 1️⃣2️⃣ Compute Billing Breakdown
        const breakdown = {
            base_rent: baseRent,
            water: billing?.total_water_amount || 0,
            electricity: billing?.total_electricity_amount || 0,
            advance_payment_required: totalAdvanceRequired,
            advance_payment_amount: Number(advance_payment_amount || 0),
            advance_months: advance_payment_months,
            is_advance_payment_paid: !!is_advance_payment_paid,
            total_before_late_fee: billing
                ? Number(billing.total_amount_due || 0)
                : baseRent,
        };

        // 1️⃣3️⃣ Final Response Object
        const response = {
            billing: billing
                ? {
                    ...billing,
                    unit_name: unitName,
                    billing_period: billing.billing_period || new Date(),
                    total_amount_due: Number(billing.total_amount_due || 0).toFixed(2),
                    payment_status: billing.payment_status || "unpaid",
                    payment_proof_url: billing.proof_of_payment || null,
                    receipt_reference: billing.receipt_reference || null,
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

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error("❌ Billing Fetch Error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
