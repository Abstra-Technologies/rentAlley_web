import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { decryptData } from "@/crypto/encrypt";

const toNum = (v: any) => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
};

const php = (v: any) =>
    toNum(v).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export async function GET(
    req: NextRequest,
    { params }: { params: { billing_id: string } }
) {
    try {
        const billingId = params.billing_id;

        // 🔹 1. Get Billing + Unit + Property
        const [rows]: any = await db.query(
            `
                SELECT b.*,
                       u.unit_name, u.rent_amount, u.unit_id,
                       p.property_id, p.property_name, p.city, p.province, p.advance_payment_months
                FROM Billing b
                         JOIN Unit u ON b.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE b.billing_id = ?
                LIMIT 1
            `,
            [billingId]
        );

        if (!rows?.length) {
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });
        }

        const bill = rows[0];

        // 🔹 2. Get tenant details (via active lease)
        const [tenantRows]: any = await db.query(
            `
                SELECT
                    t.tenant_id,
                    u.user_id,
                    u.firstName,
                    u.lastName,
                    u.email,
                    u.phoneNumber
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User u ON t.user_id = u.user_id
                WHERE la.unit_id = ?
                LIMIT 1
            `,
            [bill.unit_id]
        );

        const tenant = tenantRows?.[0] || null;

        const decryptedTenant = tenant
            ? {
                ...tenant,
                firstName: tenant.firstName
                    ? decryptData(JSON.parse(tenant.firstName), process.env.ENCRYPTION_SECRET!)
                    : "",
                lastName: tenant.lastName
                    ? decryptData(JSON.parse(tenant.lastName), process.env.ENCRYPTION_SECRET!)
                    : "",
                email: tenant.email
                    ? decryptData(JSON.parse(tenant.email), process.env.ENCRYPTION_SECRET!)
                    : "",
                phoneNumber: tenant.phoneNumber
                    ? decryptData(JSON.parse(tenant.phoneNumber), process.env.ENCRYPTION_SECRET!)
                    : "",
            }
            : null;

        // 🔹 3. Fetch PropertyConfiguration for due day
        const [configRows]: any = await db.query(
            `
        SELECT billingDueDay
        FROM PropertyConfiguration
        WHERE property_id = ?
        LIMIT 1
      `,
            [bill.property_id]
        );

        const config = configRows?.[0] || {};
        const billingDueDay = Number(config.billingDueDay || 1);

        // ✅ Compute due date from PropertyConfig
        const billingPeriod = new Date(bill.billing_period);
        const dueDate = new Date(
            billingPeriod.getFullYear(),
            billingPeriod.getMonth(),
            billingDueDay
        );
        const dueDateStr = dueDate.toLocaleDateString("en-CA");

        // 🔹 4. Additional Charges and Lease Expenses
        const [addCharges]: any = await db.query(
            `SELECT charge_category, charge_type, amount 
       FROM BillingAdditionalCharge 
       WHERE billing_id = ?`,
            [billingId]
        );

        const [leaseRows]: any = await db.query(
            `
        SELECT agreement_id, start_date, end_date,
               advance_payment_amount, is_advance_payment_paid
        FROM LeaseAgreement
        WHERE unit_id = ?
        ORDER BY start_date DESC
        LIMIT 1
      `,
            [bill.unit_id]
        );

        const lease = leaseRows?.[0] || null;

        const [leaseExpenses]: any = lease
            ? await db.query(
                `SELECT expense_type, amount, frequency 
           FROM LeaseAdditionalExpense 
           WHERE agreement_id = ?`,
                [lease.agreement_id]
            )
            : [[]];

        // 🔹 5. Compute advance deduction
        const advanceMonths = toNum(bill.advance_payment_months);
        const perMonthAdvance = lease ? toNum(lease.advance_payment_amount) : 0;
        const advanceDeductRequired =
            lease && lease.is_advance_payment_paid
                ? perMonthAdvance * (advanceMonths || 0)
                : 0;

        // 🔹 6. Build charge & expense rows
        const chargesRows = (addCharges || [])
            .map(
                (c: any) => `
          <tr>
            <td>${c.charge_type} ${c.charge_category === "discount" ? "(discount)" : ""}</td>
            <td>${c.charge_category === "discount" ? "-" : ""}${php(c.amount)}</td>
          </tr>`
            )
            .join("");

        const expensesRows = (leaseExpenses || [])
            .map(
                (e: any) => `
          <tr>
            <td>${e.expense_type} ${e.frequency ? `(${e.frequency})` : ""}</td>
            <td>${php(e.amount)}</td>
          </tr>`
            )
            .join("");

        // 🔹 7. Build HTML PDF Template
        const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1, h2 { color: #064e3b; margin: 0 0 6px; }
            .muted { color: #6B7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #E5E7EB; padding: 8px; font-size: 13px; }
            th { background: #F9FAFB; text-align: left; }
            .total { font-weight: bold; background: #F0F9FF; }
            .section { margin-top: 18px; }
          </style>
        </head>
        <body>
          <div style="text-align:center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="margin:0; font-size: 22px; color:#064e3b; font-weight:700;">UpKyp</h2>
            <p style="margin:4px 0 0; font-size: 12px; color:#6b7280;">Your Trusted Rental Management Partner</p>
            <h2>Monthly Billing Statement</h2>
          </div>

          <!-- Tenant Details -->
<!-- Tenant + Property Header -->
<div
  style="
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f9fafb 0%, #ecfdf5 100%);
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 24px;
  "
>
  <!-- Tenant Info (Left) -->
  <div style="flex: 1; min-width: 240px;">
    ${
            decryptedTenant
                ? `
        <div style="line-height: 1.4;">
          <div style="font-size: 18px; font-weight: 700; color: #064e3b;">
            ${decryptedTenant.firstName} ${decryptedTenant.lastName}
          </div>
          <div style="font-size: 13px; color: #4b5563; margin-top: 2px;">
            ${decryptedTenant.email}
          </div>
          <div style="font-size: 13px; color: #4b5563; margin-top: 1px;">
            ${decryptedTenant.phoneNumber}
          </div>
        </div>`
                : `<div style="color: #9ca3af; font-size: 13px;">Tenant information unavailable</div>`
        }
  </div>

  <!-- Property Info (Right) -->
  <div
    style="
      flex: 1;
      min-width: 240px;
      text-align: right;
      line-height: 1.5;
    "
  >
    <div style="font-size: 15px; font-weight: 700; color: #065f46;">
      ${bill.property_name}
    </div>
    <div style="font-size: 13px; color: #4b5563;">
      ${bill.city}, ${bill.province}
    </div>
    <div style="font-size: 13px; color: #4b5563; margin-top: 2px;">
      Unit: ${bill.unit_name}
    </div>
  </div>
</div>


<!-- Key Billing Summary Card -->
<div
  style="
    background: linear-gradient(135deg, #e0f2fe 0%, #ecfdf5 100%);
    border: 1px solid #d1fae5;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  "
>
  <h3
    style="
      margin-bottom: 12px;
      font-size: 18px;
      color: #065f46;
      font-weight: 700;
      letter-spacing: 0.3px;
    "
  >
    Billing Summary
  </h3>

  <div
    style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 14px;
      color: #1f2937;
    "
  >
    <div style="flex: 1;">
      <div style="font-weight: 600; color: #047857;">Billing Period</div>
      <div style="font-size: 15px; color: #111827; margin-top: 2px;">
        ${bill.billing_period}
      </div>
    </div>

    <div style="flex: 1;">
      <div style="font-weight: 600; color: #047857;">Due Date</div>
      <div style="font-size: 15px; color: #111827; margin-top: 2px;">
        ${dueDateStr}
      </div>
    </div>

    <div style="flex: 1; text-align: right;">
      <div style="font-weight: 600; color: #047857;">Total Amount Due</div>
      <div
        style="
          font-size: 20px;
          font-weight: 800;
          color: #064e3b;
          margin-top: 2px;
        "
      >
        ₱${php(bill.total_amount_due)}
      </div>
    </div>
  </div>
</div>



          <div class="section">
            <h2>Breakdown</h2>
            <table>
              <tr><th>Description</th><th>Amount (₱)</th></tr>
              <tr><td>Base Rent</td><td>${php(bill.rent_amount)}</td></tr>
              ${
            advanceDeductRequired > 0
                ? `<tr><td>Advance Payment Deduction (${advanceMonths} month${
                    advanceMonths > 1 ? "s" : ""
                })</td><td>-${php(advanceDeductRequired)}</td></tr>`
                : ""
        }
              ${chargesRows || ""}
              ${expensesRows || ""}
              <tr class="total"><td>Total Amount Due</td><td>${php(
            bill.total_amount_due
        )}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `;

        // 🔹 8. Generate PDF
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="billing-statement-${billingId}.pdf"`,
            },
        });
    } catch (err: any) {
        console.error("❌ PDF generation error:", err);
        return NextResponse.json(
            { error: "Failed to generate billing PDF" },
            { status: 500 }
        );
    }
}
