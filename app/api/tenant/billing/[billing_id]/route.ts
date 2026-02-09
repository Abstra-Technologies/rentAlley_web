import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import { decryptData } from "@/crypto/encrypt";
import { formatDate } from "@/utils/formatter/formatters";

/* ---------------- HELPERS ---------------- */
const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const php = (v: any) =>
    toNum(v).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

function monthRange(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const ymd = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;
    return { start: ymd(start), end: ymd(end) };
}

/* ---------------- API ---------------- */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ billing_id: string }> }
) {
    try {
        const { billing_id } = await context.params;

        /* ---------- BILLING ---------- */
        const [rows]: any = await db.query(
            `
      SELECT 
        b.*,
        u.unit_name,
        u.unit_id,
        u.rent_amount,
        p.property_name,
        p.city,
        p.province,
        p.property_id
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE b.billing_id = ?
      LIMIT 1
      `,
            [billing_id]
        );

        if (!rows?.length) {
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });
        }

        const bill = rows[0];
        const billingDate = new Date(bill.billing_period);
        const { start, end } = monthRange(billingDate);

        /* ---------- PROPERTY CONFIG ---------- */
        const [[cfg]]: any = await db.query(
            `
      SELECT 
        billingDueDay,
        lateFeeType,
        lateFeeAmount,
        gracePeriodDays
      FROM PropertyConfiguration
      WHERE property_id = ?
      LIMIT 1
      `,
            [bill.property_id]
        );

        const dueDay = Number(cfg?.billingDueDay || 1);
        const dueDate = new Date(
            billingDate.getFullYear(),
            billingDate.getMonth(),
            dueDay
        );

        /* ---------- DAYS LATE ---------- */
        const today = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;

        const daysLate = Math.max(
            Math.floor((today.getTime() - dueDate.getTime()) / msPerDay),
            0
        );

        const effectiveLateDays = Math.max(
            daysLate - toNum(cfg?.gracePeriodDays),
            0
        );

        /* ---------- TENANT ---------- */
        const [tenantRows]: any = await db.query(
            `
      SELECT u.firstName, u.lastName, u.email, u.phoneNumber
      FROM LeaseAgreement la
      JOIN Tenant t ON la.tenant_id = t.tenant_id
      JOIN User u ON t.user_id = u.user_id
      WHERE la.unit_id = ?
      ORDER BY la.start_date DESC
      LIMIT 1
      `,
            [bill.unit_id]
        );

        const tenant = tenantRows?.[0];
        const decryptedTenant = tenant
            ? {
                firstName: decryptData(JSON.parse(tenant.firstName), process.env.ENCRYPTION_SECRET!),
                lastName: decryptData(JSON.parse(tenant.lastName), process.env.ENCRYPTION_SECRET!),
                email: decryptData(JSON.parse(tenant.email), process.env.ENCRYPTION_SECRET!),
                phoneNumber: decryptData(JSON.parse(tenant.phoneNumber), process.env.ENCRYPTION_SECRET!),
            }
            : null;

        /* ---------- METERS ---------- */
        const [[water]]: any = await db.query(
            `
      SELECT previous_reading, current_reading, consumption
      FROM WaterMeterReading
      WHERE unit_id = ? AND period_start = ? AND period_end = ?
      LIMIT 1
      `,
            [bill.unit_id, start, end]
        );

        const [[elec]]: any = await db.query(
            `
      SELECT previous_reading, current_reading, consumption
      FROM ElectricMeterReading
      WHERE unit_id = ? AND period_start = ? AND period_end = ?
      LIMIT 1
      `,
            [bill.unit_id, start, end]
        );

        /* ---------- ADDITIONAL CHARGES (EXCEPT LATE FEE) ---------- */
        const [charges]: any = await db.query(
            `
      SELECT charge_category, charge_type, amount
      FROM BillingAdditionalCharge
      WHERE billing_id = ?
        AND charge_type NOT IN ('Late Fee', 'Late Fee Applied')
      `,
            [billing_id]
        );

        let additions = 0;
        let discounts = 0;

        for (const c of charges) {
            if (c.charge_category === "discount") {
                discounts += toNum(c.amount);
            } else {
                additions += toNum(c.amount);
            }
        }

        /* ---------- DYNAMIC LATE FEE ---------- */
        let lateFeeAmount = 0;
        let lateFeeLabel = "";

        if (effectiveLateDays > 0 && toNum(cfg?.lateFeeAmount) > 0) {
            if (cfg.lateFeeType === "fixed") {
                lateFeeAmount = effectiveLateDays * toNum(cfg.lateFeeAmount);
                lateFeeLabel = `Late Fee (${effectiveLateDays} days × ₱${php(cfg.lateFeeAmount)})`;
            } else if (cfg.lateFeeType === "percentage") {
                const daily = toNum(bill.rent_amount) * (toNum(cfg.lateFeeAmount) / 100);
                lateFeeAmount = effectiveLateDays * daily;
                lateFeeLabel = `Late Fee (${effectiveLateDays} days × ${cfg.lateFeeAmount}% of rent)`;
            }
        }

        /* ---------- TOTALS ---------- */
        const utilitiesTotal =
            toNum(bill.total_water_amount) +
            toNum(bill.total_electricity_amount);

        const subtotal =
            toNum(bill.rent_amount) +
            utilitiesTotal +
            additions +
            lateFeeAmount;

        const totalDue = subtotal - discounts;

        /* ---------- HTML ---------- */
        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
@page { size: A4; margin: 0; }
body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
.page { min-height: 297mm; display: flex; flex-direction: column; }
.header { padding: 24px 48px; background: linear-gradient(90deg,#696EFF,#F8ACFF); color: #fff; }
.brand { font-size: 28px; font-weight: 800; }
.content { flex: 1; padding: 36px 48px; }
.section { margin-top: 24px; }
.section-title { font-weight: 700; margin-bottom: 10px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
td, th { padding: 8px; border-bottom: 1px solid #e5e7eb; }
.right { text-align: right; }
.total { font-size: 18px; font-weight: 800; }
.footer { padding: 16px 48px; background: linear-gradient(90deg,#696EFF,#F8ACFF); color: #fff; text-align: center; font-size: 11px; }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div class="brand">Upkyp</div>
  <div>Billing ID: ${billing_id}</div>
</div>

<div class="content">
  <h2 style="text-align:center">STATEMENT OF ACCOUNT</h2>

  <div class="section">
    <strong>${bill.property_name}</strong><br/>
    ${bill.city}, ${bill.province}
  </div>

  <div class="section">
    <strong>Tenant</strong><br/>
    ${
            decryptedTenant
                ? `${decryptedTenant.firstName} ${decryptedTenant.lastName}<br/>${decryptedTenant.email}`
                : "—"
        }
  </div>

  <div class="section">
    <table>
      <tr>
        <th>Billing Period</th>
        <th>Due Date</th>
        <th class="right">Total Due</th>
      </tr>
      <tr>
        <td>${formatDate(billingDate)}</td>
        <td>${dueDate.toLocaleDateString("en-CA")}</td>
        <td class="right total">₱${php(totalDue)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Charges Breakdown</div>
    <table>
      <tr><td>Rent</td><td class="right">₱${php(bill.rent_amount)}</td></tr>
      <tr><td>Utilities</td><td class="right">₱${php(utilitiesTotal)}</td></tr>
      ${
            effectiveLateDays > 0
                ? `<tr><td>${lateFeeLabel}</td><td class="right">₱${php(lateFeeAmount)}</td></tr>`
                : ""
        }
      ${
            charges
                .map(
                    (c: any) =>
                        `<tr><td>${c.charge_type}</td><td class="right">₱${php(c.amount)}</td></tr>`
                )
                .join("")
        }
    </table>
  </div>
</div>

<div class="footer">
  Upkyp · Property Rental Management Platform
</div>

</div>
</body>
</html>
`;

        /* ---------- PDF ---------- */
        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        await browser.close();

        return new NextResponse(pdf, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="upkyp-billing-${billing_id}.pdf"`,
            },
        });
    } catch (err) {
        console.error("PDF ERROR:", err);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
