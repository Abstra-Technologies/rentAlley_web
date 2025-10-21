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

        // 🔹 2. Get Tenant info
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

        // 🔹 3. Get Property Config
        const [configRows]: any = await db.query(
            `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
            [bill.property_id]
        );
        const config = configRows?.[0] || {};
        const billingDueDay = Number(config.billingDueDay || 1);

        const billingPeriod = new Date(bill.billing_period);
        const dueDate = new Date(
            billingPeriod.getFullYear(),
            billingPeriod.getMonth(),
            billingDueDay
        );
        const dueDateStr = dueDate.toLocaleDateString("en-CA");

        // 🔹 4. Additional Charges
        const [addCharges]: any = await db.query(
            `SELECT charge_category, charge_type, amount
             FROM BillingAdditionalCharge
             WHERE billing_id = ?`,
            [billingId]
        );

        // 🔹 5. Post-Dated Checks for this lease/month
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

        // 🔹 6. Advance payment computation
        const advanceMonths = toNum(bill.advance_payment_months);
        const advanceDeductRequired =
            advanceMonths > 0 ? toNum(bill.rent_amount) * advanceMonths : 0;

        // 🔹 7. Build charge rows
        const chargesRows = (addCharges || [])
            .map(
                (c: any) => `
        <tr>
          <td>${c.charge_type} ${
                    c.charge_category === "discount" ? "(discount)" : ""
                }</td>
          <td>${c.charge_category === "discount" ? "-" : ""}${php(c.amount)}</td>
        </tr>`
            )
            .join("");

        // 🔹 8. Build PDC section rows
        const pdcRowsHtml =
            pdcRows.length > 0
                ? pdcRows
                    .map(
                        (p: any) => `
              <tr>
                <td>${p.bank_name}</td>
                <td>${p.check_number}</td>
                <td>${php(p.amount)}</td>
                <td>${new Date(p.due_date).toLocaleDateString("en-CA")}</td>
                <td>${p.status}</td>
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="5" style="text-align:center;color:#6b7280;">No post-dated checks found for this month.</td></tr>`;

        // 🔹 9. Build HTML
        const html = `
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      /* 🌈 Full-page dark gradient background (UpKyp brand) */
      html, body {
        height: 100%;
        margin: 0;
        font-family: "Inter", Arial, sans-serif;
        color: #f9fafb;
        background: linear-gradient(135deg, #064e3b 0%, #1e3a8a 100%);
        background-attachment: fixed;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        position: relative;
      }

      /* 💧 Subtle watermark */
      body::before {
        content: "UpKyp - Connect More. Manage Less";
        position: fixed;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 42px;
        font-weight: 700;
        color: rgba(255,255,255,0.05);
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        z-index: 0;
      }

      .content {
        padding: 48px;
        z-index: 2;
        position: relative;
      }

      /* 🌿 Header: visible on dark bg */
      .header {
        text-align: center;
        margin-bottom: 36px;
        color: #ffffff;
      }
      .header-logo {
        font-size: 40px;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #10b981;
        text-shadow: 0 2px 6px rgba(0,0,0,0.3);
        margin: 0;
      }
      .header-tagline {
        font-size: 14px;
        color: #d1fae5;
        opacity: 0.9;
        margin: 4px 0 12px;
      }
      .header-divider {
        height: 2px;
        width: 100px;
        margin: 0 auto 14px;
        background: linear-gradient(to right, #10b981, #3b82f6);
        border-radius: 9999px;
      }
      .header-title {
        font-size: 20px;
        font-weight: 600;
        color: #bfdbfe;
        margin: 0;
      }

      /* Layout blocks (no card background) */
      .section {
        margin-top: 32px;
      }

      .flex-between {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 12px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid rgba(255,255,255,0.25);
        padding: 8px;
        font-size: 13px;
      }
      th {
        background: rgba(255,255,255,0.15);
        text-align: left;
        color: #f9fafb;
      }
      td {
        background: rgba(255,255,255,0.08);
        color: #f9fafb;
      }
      .total {
        font-weight: bold;
        background: rgba(16,185,129,0.25);
        color: #ffffff;
      }

      .section h2 {
        color: #a7f3d0;
        margin-bottom: 8px;
        font-size: 14px; /* smaller headers */
        letter-spacing: 0.3px;
        border-left: 3px solid #10b981;
        padding-left: 6px;
      }

      strong { color:#ffffff; }
      .muted { color: #d1d5db; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="content">
      <!-- 🌿 Header -->
      <div class="header">
        <h1 class="header-logo">UpKyp</h1>
        <p class="header-tagline">Connect More. Manage Less.</p>
        <div class="header-divider"></div>
        <h2 class="header-title">Monthly Billing Statement</h2>
      </div>

      <!-- Tenant + Property -->
      <div class="flex-between" style="margin-bottom:28px;">
        <div>
          ${
            decryptedTenant
                ? `<strong>${decryptedTenant.firstName} ${decryptedTenant.lastName}</strong><br/>
                 <span style="font-size:13px;">${decryptedTenant.email}</span><br/>
                 <span style="font-size:13px;">${decryptedTenant.phoneNumber}</span>`
                : `<span class="muted">Tenant info unavailable</span>`
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
        <tr>
          <td>${bill.billing_period}</td>
          <td>${dueDateStr}</td>
          <td><strong>₱${php(bill.total_amount_due)}</strong></td>
        </tr>
      </table>

      <!-- Breakdown -->
      <div class="section">
        <h2>Billing Breakdown</h2>
        <table>
          <tr><th>Description</th><th>Amount (₱)</th></tr>
          <tr><td>Base Rent</td><td>${php(bill.rent_amount)}</td></tr>
          ${
            advanceDeductRequired > 0
                ? `<tr><td>Advance Payment Deduction (${advanceMonths} month${advanceMonths > 1 ? "s" : ""})</td><td>-${php(advanceDeductRequired)}</td></tr>`
                : ""
        }
          ${chargesRows || ""}
          <tr class="total"><td>Total Amount Due</td><td>${php(bill.total_amount_due)}</td></tr>
        </table>
      </div>

      <!-- Post-Dated Checks -->
      <div class="section">
        <h2>Post-Dated Checks</h2>
        <table>
          <tr>
            <th>Bank</th>
            <th>Check #</th>
            <th>Amount (₱)</th>
            <th>Issue Date</th>
            <th>Status</th>
          </tr>
          ${pdcRowsHtml}
        </table>
      </div>
    </div>
  </body>
</html>
`;

        // 🔹 10. Generate PDF
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
            { error: "Failed to generate billing PDF", details: err.message },
            { status: 500 }
        );
    }
}
