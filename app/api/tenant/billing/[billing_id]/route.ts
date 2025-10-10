import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";

const toNum = (v: any) => {
    if (v === null || v === undefined) return 0;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
};
const php = (v: any) =>
    toNum(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(
    req: NextRequest,
    { params }: { params: { billing_id: string } }
) {
    try {
        const billingId = params.billing_id;

        // Billing + Unit + Property (add rent_amount!)
        const [rows]: any = await db.query(
            `SELECT b.*, 
              u.unit_name, u.rent_amount, u.unit_id,
              p.property_name, p.city, p.province, p.advance_payment_months
       FROM Billing b
       JOIN Unit u ON b.unit_id = u.unit_id
       JOIN Property p ON u.property_id = p.property_id
       WHERE b.billing_id = ?
       LIMIT 1`,
            [billingId]
        );
        if (!rows?.length) {
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });
        }
        const bill = rows[0];

        // Latest lease for this unit (for advance deduction display)
        const [leaseRows]: any = await db.query(
            `SELECT agreement_id, start_date, end_date,
              advance_payment_amount, is_advance_payment_paid
       FROM LeaseAgreement
       WHERE unit_id = ?
       ORDER BY start_date DESC
       LIMIT 1`,
            [bill.unit_id]
        );
        const lease = leaseRows?.[0] || null;

        // Optional: itemize additional charges/expenses
        const [addCharges]: any = await db.query(
            `SELECT charge_category, charge_type, amount 
       FROM BillingAdditionalCharge 
       WHERE billing_id = ?`,
            [billingId]
        );

        const [leaseExpenses]: any = lease
            ? await db.query(
                `SELECT expense_type, amount, frequency 
           FROM LeaseAdditionalExpense 
           WHERE agreement_id = ?`,
                [lease.agreement_id]
            )
            : [[]];

        // Compute advance deduction (only if marked paid)
        const advanceMonths = toNum(bill.advance_payment_months); // from Property
        const perMonthAdvance = lease ? toNum(lease.advance_payment_amount) : 0;
        const advanceDeductRequired = lease && lease.is_advance_payment_paid
            ? perMonthAdvance * (advanceMonths || 0)
            : 0;

        // Build rows for charges/expenses
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

        // Build HTML (use our php() formatter everywhere)
        const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { color: #111827; margin: 0 0 6px; }
            h2 { margin: 18px 0 8px; }
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
    <h2 style="margin:0; font-size: 22px; color:#064e3b; font-weight:700;">
      UpKyp
    </h2>
    <p style="margin:4px 0 0; font-size: 12px; color:#6b7280;">
      Your Trusted Rental Management Partner
    </p>
    <h2>Billing Details</h2>
  </div>

  <!-- ✅ Statement Content -->
  
  <div class="muted">
    <div><strong>Property:</strong> ${bill.property_name}, ${bill.city}, ${bill.province}</div>
    <div><strong>Unit:</strong> ${bill.unit_name}</div>
    <div><strong>Billing Period:</strong> ${bill.billing_period}</div>
    <div><strong>Due Date:</strong> ${bill.due_date}</div>
    <div><strong>Status:</strong> ${bill.status}${bill.paid_at ? ` · Paid on ${bill.paid_at}` : ""}</div>
  </div>

  <div class="section">
    <h2>Breakdown</h2>
    <table>
      <tr><th>Description</th><th>Amount (₱)</th></tr>
      <tr><td>Base Rent</td><td>${php(bill.rent_amount)}</td></tr>
      ${
            advanceDeductRequired > 0
                ? `<tr><td>Advance Payment Deduction (${advanceMonths} month${advanceMonths > 1 ? "s" : ""})</td><td>-${php(advanceDeductRequired)}</td></tr>`
                : ""
        }
      ${chargesRows || ""}
      ${expensesRows || ""}
      <tr><td>Penalty</td><td>${php(bill.penalty_amount)}</td></tr>
      <tr><td>Discount</td><td>-${php(bill.discount_amount)}</td></tr>
      <tr class="total"><td>Total Amount Due</td><td>${php(bill.total_amount_due)}</td></tr>
    </table>
  </div>
</body>
      </html>
    `;

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
        return NextResponse.json({ error: "Failed to generate billing PDF" }, { status: 500 });
    }
}
