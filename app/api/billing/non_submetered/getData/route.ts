import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id) {
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });
        }

        // 1️⃣ Get all active leases for property
        const [rows]: any = await db.query(
            `
                SELECT
                    la.agreement_id,
                    la.unit_id,
                    la.tenant_id,
                    la.security_deposit_amount,
                    la.advance_payment_amount,
                    la.late_penalty_amount,
                    p.advance_payment_months,
                    un.unit_name,
                    us.firstName,
                    us.lastName,
                    p.property_name,
                    un.rent_amount AS base_rent,
                    CURDATE() AS billing_period
                FROM LeaseAgreement la
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User us ON t.user_id = us.user_id
                         JOIN Property p ON un.property_id = p.property_id
                WHERE la.status = 'active'
                  AND p.property_id = ?
                  AND (p.water_billing_type != 'submetered' OR p.electricity_billing_type != 'submetered')
            `,
            [property_id]
        );

        // 2️⃣ Loop and fetch each unit’s billing and its charges
        const bills = await Promise.all(
            rows.map(async (row: any) => {
                const firstName = row.firstName
                    ? await decryptData(JSON.parse(row.firstName), process.env.ENCRYPTION_SECRET!)
                    : "";
                const lastName = row.lastName
                    ? await decryptData(JSON.parse(row.lastName), process.env.ENCRYPTION_SECRET!)
                    : "";

                // Get current month’s billing
                const [billingRows]: any = await db.query(
                    `
                        SELECT billing_id, total_amount_due, status
                        FROM Billing
                        WHERE unit_id = ?
                          AND MONTH(billing_period) = MONTH(CURDATE())
                          AND YEAR(billing_period) = YEAR(CURDATE())
                        LIMIT 1
                    `,
                    [row.unit_id]
                );

                const billing_id = billingRows?.[0]?.billing_id || null;

                // ✅ Get charges including id AS charge_id
                let additional_charges: any[] = [];
                let discounts: any[] = [];

                if (billing_id) {
                    const [charges]: any = await db.query(
                        `
            SELECT
              id AS charge_id,
              charge_category,
              charge_type,
              amount
            FROM BillingAdditionalCharge
            WHERE billing_id = ?
            `,
                        [billing_id]
                    );

                    additional_charges = charges.filter(
                        (c: any) => c.charge_category === "additional"
                    );
                    discounts = charges.filter(
                        (c: any) => c.charge_category === "discount"
                    );
                }

                return {
                    ...row,
                    tenant_name: `${firstName} ${lastName}`.trim(),
                    billing_id,
                    additional_charges,
                    discounts,
                };
            })
        );

        return NextResponse.json({ bills });
    } catch (error: any) {
        console.error("Error fetching non-submetered billing:", error);
        return NextResponse.json(
            { error: "Failed to fetch non-submetered billing data" },
            { status: 500 }
        );
    }
}

