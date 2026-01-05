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
            SELECT b.*, u.unit_name, u.unit_id, u.rent_amount,
                   p.property_name, p.city, p.province, p.property_id
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

        /* ---------- PROPERTY CONFIG ---------- */
        const [[cfg]]: any = await db.query(
            `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
            [bill.property_id]
        );

        const dueDay = Number(cfg?.billingDueDay || 1);
        const dueDate = new Date(
            billingDate.getFullYear(),
            billingDate.getMonth(),
            dueDay
        );

        /* ---------- METERS ---------- */
        const [[water]]: any = await db.query(
            `
            SELECT previous_reading, current_reading, consumption
            FROM WaterMeterReading
            WHERE unit_id = ?
              AND period_start = ?
              AND period_end = ?
            LIMIT 1
            `,
            [bill.unit_id, start, end]
        );

        const [[elec]]: any = await db.query(
            `
            SELECT previous_reading, current_reading, consumption
            FROM ElectricMeterReading
            WHERE unit_id = ?
              AND period_start = ?
              AND period_end = ?
            LIMIT 1
            `,
            [bill.unit_id, start, end]
        );

        /* ---------- ADDITIONAL CHARGES ---------- */
        const [charges]: any = await db.query(
            `
            SELECT charge_category, charge_type, amount
            FROM BillingAdditionalCharge
            WHERE billing_id = ?
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

        /* ---------- TOTALS ---------- */
        const utilitiesTotal =
            toNum(bill.total_water_amount) +
            toNum(bill.total_electricity_amount);

        const subtotal =
            toNum(bill.rent_amount) +
            utilitiesTotal +
            additions;

        const totalDue = subtotal - discounts;

        /* ---------- HTML ---------- */
        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>

<style>
@page {
  size: A4;
  margin: 0;
}

body {
  font-family: "Helvetica Neue", Arial, sans-serif;
  background: #ffffff;
  color: #111827;
  margin: 0;
}

/* ===== PAGE WRAPPER ===== */
.page {
  min-height: 297mm;
  display: flex;
  flex-direction: column;
}

/* ===== HEADER ===== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  background: linear-gradient(90deg, #696EFF, #F8ACFF);
  color: #ffffff;
}

.brand {
  font-size: 28px;
  font-weight: 800;
}

.subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.85);
}

.badge {
  font-size: 13px;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,0.22);
  color: #ffffff;
  font-weight: 600;
}

/* ===== CONTENT ===== */
.content {
  flex: 1;
  padding: 36px 48px;
}

.statement-title {
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 28px;
}

.section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  text-transform: uppercase;
  color: #374151;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
}

.property-name {
  font-size: 22px;
  font-weight: 800;
}

.property-address {
  font-size: 14px;
  color: #374151;
  margin-top: 4px;
}

.label {
  font-weight: 600;
  color: #374151;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 6px;
}

th {
  color: #6b7280;
  font-weight: 600;
}

.right {
  text-align: right;
}

.total {
  font-size: 20px;
  font-weight: 800;
}

/* ===== FOOTER ===== */
.footer {
  padding: 16px 48px;
  background: linear-gradient(90deg, #696EFF, #F8ACFF);
  color: rgba(255,255,255,0.9);
  font-size: 11px;
  text-align: center;
}
</style>
</head>

<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="brand">Upkyp</div>
      <div class="subtitle">Billing Statement</div>
    </div>
    <div class="badge">Billing ID: ${billing_id}</div>
  </div>

  <!-- CONTENT -->
  <div class="content">

    <div class="statement-title">STATEMENT OF ACCOUNT</div>

    <div class="section card">
      <div class="property-name">${bill.property_name}</div>
      <div class="property-address">${bill.city}, ${bill.province}</div>
    </div>

    <div class="section card">
      <div class="section-title">Tenant Information</div>
      ${
            decryptedTenant
                ? `
          <div><span class="label">Name:</span> ${decryptedTenant.firstName} ${decryptedTenant.lastName}</div>
          <div><span class="label">Email:</span> ${decryptedTenant.email}</div>
          <div><span class="label">Phone:</span> ${decryptedTenant.phoneNumber}</div>
          <div><span class="label">Unit Occupied:</span> ${bill.unit_name}</div>
        `
                : "—"
        }
    </div>

    <div class="section card">
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

    <div class="section card">
      <div class="section-title">Charges Breakdown</div>
      <table>
        <tr>
          <td>Rent</td>
          <td class="right">₱${php(bill.rent_amount)}</td>
        </tr>
        <tr>
          <td>Utilities</td>
          <td class="right">₱${php(utilitiesTotal)}</td>
        </tr>
        ${
            charges.length
                ? charges.map(
                    (c: any) => `
          <tr>
            <td>${c.charge_type}</td>
            <td class="right">
              ${c.charge_category === "discount" ? "-" : ""}₱${php(c.amount)}
            </td>
          </tr>
        `
                ).join("")
                : ""
        }
      </table>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    Upkyp · Property Rental Management Platform — ${bill.property_name}
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
