import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { decryptData } from "@/crypto/encrypt";
import { formatDate } from "@/utils/formatter/formatters";
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
    context: { params: Promise<{ billing_id: string }> }
) {
    try {
        const { billing_id } = await context.params;

        // 1️⃣ Fetch billing, unit, and property
        const [rows]: any = await db.query(
            `
                SELECT
                    b.*,
                    u.unit_name,
                    u.rent_amount,
                    u.unit_id,
                    p.property_id,
                    p.property_name,
                    p.city,
                    p.province
                FROM Billing b
                         JOIN Unit u ON b.unit_id = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE b.billing_id = ?
                LIMIT 1

            `,
            [billing_id]
        );

        if (!rows?.length)
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });

        const bill = rows[0];

        // 2️⃣ Tenant info (latest agreement)
        const [tenantRows]: any = await db.query(
            `
                SELECT
                    t.tenant_id,
                    la.agreement_id,
                    u.user_id,
                    u.firstName,
                    u.lastName,
                    u.email,
                    u.phoneNumber
                FROM LeaseAgreement la
                         JOIN Tenant t ON la.tenant_id = t.tenant_id
                         JOIN User u ON t.user_id = u.user_id
                WHERE la.unit_id = ?
                ORDER BY la.start_date DESC
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

        // 3️⃣ Property configuration (for due date)
        const [configRows]: any = await db.query(
            `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
            [bill.property_id]
        );
        const config = configRows?.[0] || {};
        const billingDueDay = Number(config.billingDueDay || 1);
        const billingDate = new Date(bill.billing_period);
        const formattedBillingPeriod = formatDate(billingDate);

        const dueDate = new Date(
            billingDate.getFullYear(),
            billingDate.getMonth(),
            billingDueDay
        );

        const dueDateStr = dueDate.toLocaleDateString("en-CA");

        // 4️⃣ Additional charges
        const [addCharges]: any = await db.query(
            `SELECT charge_category, charge_type, amount FROM BillingAdditionalCharge WHERE billing_id = ?`,
            [billing_id]
        );

        // 5️⃣ PDCs
        const [pdcRows]: any = await db.query(
            `
                SELECT bank_name, check_number, amount, due_date, status
                FROM PostDatedCheck
                WHERE lease_id = ?
                  AND MONTH(due_date) = MONTH(?)
                  AND YEAR(due_date) = YEAR(?)
                ORDER BY due_date ASC
            `,
            [tenant?.agreement_id, bill.billing_period, bill.billing_period]
        );

        // 6️⃣ CLEARED PDCs for this month
        const [clearedPdcRows]: any = await db.query(
            `
                SELECT amount
                FROM PostDatedCheck
                WHERE lease_id = ?
                  AND status = 'cleared'
                  AND MONTH(due_date) = MONTH(?)
                  AND YEAR(due_date) = YEAR(?)
            `,
            [tenant?.agreement_id, bill.billing_period, bill.billing_period]
        );
        const totalClearedPdc = clearedPdcRows.reduce(
            (sum: number, r: any) => sum + toNum(r.amount),
            0
        );

        // 7️⃣ Meter readings (optional)
        const [meterRows]: any = await db.query(
            `
                SELECT utility_type, previous_reading, current_reading
                FROM MeterReading
                WHERE unit_id = ?
                  AND MONTH(reading_date) = MONTH(?)
                  AND YEAR(reading_date) = YEAR(?)
                ORDER BY utility_type ASC
            `,
            [bill.unit_id, bill.billing_period, bill.billing_period]
        );

        const hasMeter = meterRows.length > 0;
        const water = meterRows.find((m: any) => m.utility_type === "water");
        const elec = meterRows.find((m: any) => m.utility_type === "electricity");
        const waterUsage = water ? toNum(water.current_reading) - toNum(water.previous_reading) : 0;
        const elecUsage = elec ? toNum(elec.current_reading) - toNum(elec.previous_reading) : 0;

        // 8️⃣ Compute totals
        const baseRent = toNum(bill.rent_amount);
        const utilitiesTotal =
            toNum(bill.total_water_amount) + toNum(bill.total_electricity_amount);
        const addChargesTotal = addCharges.reduce((sum: number, c: any) => {
            const amt = toNum(c.amount);
            return c.charge_category === "discount" ? sum - amt : sum + amt;
        }, 0);

        const pdcAppliedToRent = Math.min(totalClearedPdc, baseRent);
        let adjustedTotal = (baseRent - pdcAppliedToRent) + utilitiesTotal + addChargesTotal;
        if (adjustedTotal < 0) adjustedTotal = 0;

        // 9️⃣ Dynamic sections
        const chargesRowsHtml = addCharges
            .map(
                (c: any) => `
        <tr>
          <td>${c.charge_type} ${c.charge_category === "discount" ? "(discount)" : ""}</td>
          <td>${c.charge_category === "discount" ? "-" : ""}${php(c.amount)}</td>
        </tr>`
            )
            .join("");

        const pdcRowsHtml =
            pdcRows.length > 0
                ? pdcRows
                    .map(
                        (p: any) => `
              <tr>
                <td>${p.bank_name || "—"}</td>
                <td>${p.check_number}</td>
                <td>${php(p.amount)}</td>
                <td>${new Date(p.due_date).toLocaleDateString("en-CA")}</td>
                <td>${p.status}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5" style="text-align:center;color:#6b7280;">No post-dated checks for this month.</td></tr>`;

        const pdcAppliedRow =
            pdcAppliedToRent > 0
                ? `<tr><td>PDC Cleared (applied to rent)</td><td>-${php(pdcAppliedToRent)}</td></tr>`
                : "";

        const meterSection = hasMeter
            ? `
      <div class="section">
        <h2>Meter Reading Summary</h2>
     <table>
  <tr>
    <th>Utility</th>
    <th>Previous</th>
    <th>Current</th>
    <th>Consumption</th>
    <th>Total (₱)</th>
  </tr>
  <tr>
    <td>💧 Water</td>
    <td>${water ? water.previous_reading : "—"}</td>
    <td>${water ? water.current_reading : "—"}</td>
    <td>${waterUsage ? `${waterUsage} m³` : "0 m³"}</td>
    <td>${php(bill.total_water_amount)}</td>
  </tr>
  <tr>
    <td>⚡ Electricity</td>
    <td>${elec ? elec.previous_reading : "—"}</td>
    <td>${elec ? elec.current_reading : "—"}</td>
    <td>${elecUsage ? `${elecUsage} kWh` : "0 kWh"}</td>
    <td>${php(bill.total_electricity_amount)}</td>
  </tr>
</table>

      </div>`
            : "";

        // 🔹 PDF HTML
        const html = `
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        font-family: "Inter", Arial, sans-serif;
        color: #f9fafb;
        background: linear-gradient(135deg, #064e3b 0%, #1e3a8a 100%);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .content { padding: 48px; }
      .header { text-align: center; margin-bottom: 20px; position: relative; }
      .header h1 {
        font-size: 34px;
        font-weight: 800;
        margin: 0;
        color: #10b981;
        text-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .header p {
        margin: 5px 0;
        font-size: 14px;
        color: #d1fae5;
      }
      .billing-id {
        position: absolute;
        right: 0;
        top: 0;
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
        background: rgba(0,0,0,0.3);
        padding: 8px 16px;
        border-radius: 8px;
      }
      .header-divider {
        height: 2px; width: 120px; margin: 12px auto;
        background: linear-gradient(to right,#10b981,#3b82f6);
        border-radius: 9999px;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th, td { border: 1px solid rgba(255,255,255,0.25); padding: 8px; }
      th { background: rgba(255,255,255,0.15); }
      td { background: rgba(255,255,255,0.08); }
      .total { background: rgba(16,185,129,0.25); font-weight: bold; }
      .section { margin-top: 32px; }
      .section h2 { color: #a7f3d0; font-size: 14px; border-left: 3px solid #10b981; padding-left: 6px; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <div class="content">
      <div class="header">
        <div class="billing-id">Billing ID: ${billing_id}</div>
        <h1>UpKyp</h1>
        <p>Connect More. Manage Less.</p>
        <div class="header-divider"></div>
        <h2 style="color:#bfdbfe;font-size:18px;margin-top:6px;">Monthly Billing Statement</h2>
      </div>

      <!-- Tenant + Property -->
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;margin-bottom:28px;">
        <div>
          ${
            decryptedTenant
                ? `<strong>${decryptedTenant.firstName} ${decryptedTenant.lastName}</strong><br/>
                 <span style="font-size:13px;">${decryptedTenant.email}</span><br/>
                 <span style="font-size:13px;">${decryptedTenant.phoneNumber}</span>`
                : `<span style="color:#d1d5db;font-size:12px;">Tenant info unavailable</span>`
        }
        </div>
        <div style="text-align:right;">
          <strong>${bill.property_name}</strong><br/>
          <span style="font-size:13px;">${bill.city}, ${bill.province}</span><br/>
          <span style="font-size:13px;">Unit: ${bill.unit_name}</span>
        </div>
      </div>

      <!-- Summary -->
      <table>
        <tr><th>Billing Period</th><th>Due Date</th><th>Total Due</th></tr>
        <tr><td>${formattedBillingPeriod}</td><td>${dueDateStr}</td><td><strong>₱${php(adjustedTotal)}</strong></td></tr>
      </table>

      ${meterSection}

      <!-- Breakdown -->
      <div class="section">
        <h2>Billing Breakdown</h2>
        <table>
          <tr><th>Description</th><th>Amount (₱)</th></tr>
          <tr><td>Base Rent</td><td>${php(baseRent)}</td></tr>
          ${chargesRowsHtml}
          ${pdcAppliedRow}
          <tr class="total"><td>Total Amount Due</td><td>${php(adjustedTotal)}</td></tr>
        </table>
      </div>

      <!-- PDC -->
      <div class="section">
        <h2>Post-Dated Checks</h2>
        <table>
          <tr><th>Bank</th><th>Check #</th><th>Amount (₱)</th><th>Issue Date</th><th>Status</th></tr>
          ${pdcRowsHtml}
        </table>
      </div>
    </div>
  </body>
</html>
`;

        // 10️⃣ Generate PDF
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        // @ts-ignore
        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="billing-statement-${billing_id}.pdf"`,
            },
        });
    } catch (err: any) {
        console.error("❌ PDF generation error:", err);
        return NextResponse.json(
            { error: "Failed to generate billing PDF", details: err.message },
            { status: 500 }
        );
    }
}
