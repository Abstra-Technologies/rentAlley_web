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

        if (!rows?.length)
            return NextResponse.json({ error: "Billing not found" }, { status: 404 });

        const bill = rows[0];
        const billingDate = new Date(bill.billing_period);
        const { start, end } = monthRange(billingDate);

        /* ---------- TENANT ---------- */
        const [tenantRows]: any = await db.query(
            `
            SELECT u.firstName, u.lastName, u.email, u.phoneNumber,
                   la.agreement_id
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

        /* ---------- PROPERTY CONFIG (DUE DATE) ---------- */
        const [cfg]: any = await db.query(
            `SELECT billingDueDay FROM PropertyConfiguration WHERE property_id = ? LIMIT 1`,
            [bill.property_id]
        );

        const dueDay = Number(cfg?.[0]?.billingDueDay || 1);
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

        const utilitiesTotal =
            toNum(bill.total_water_amount) +
            toNum(bill.total_electricity_amount);

        const totalDue =
            toNum(bill.rent_amount) + utilitiesTotal;

        /* ---------- HTML ---------- */
        const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body {
  font-family: Inter, Arial, sans-serif;
  background: #ffffff;
  color: #111827;
  margin: 0;
  padding: 40px;
}

.brand {
  font-size: 28px;
  font-weight: 800;
  color: #10b981;
}

.tagline {
  font-size: 12px;
  color: #6b7280;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  margin-top: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit {
  font-size: 20px;
  font-weight: 700;
  margin-top: 4px;
}

.badge {
  padding: 6px 12px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-weight: 600;
  font-size: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 13px;
}

th, td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 6px;
  text-align: left;
}

th {
  color: #6b7280;
  font-weight: 600;
}

.total {
  font-size: 22px;
  font-weight: 800;
  color: #10b981;
  text-align: right;
}

.muted {
  color: #6b7280;
  font-size: 12px;
}
</style>
</head>

<body>

<!-- BRAND -->
<div class="header">
  <div>
    <div class="brand">UPKYP</div>
    <div class="tagline">Connect More. Manage Less.</div>
  </div>
  <div class="badge">Billing ID: ${billing_id}</div>
</div>

<!-- PROPERTY / UNIT -->
<div class="card">
  <strong>${bill.property_name}</strong><br/>
  <span class="muted">${bill.city}, ${bill.province}</span>
  <div class="unit">Unit ${bill.unit_name}</div>
</div>

<!-- TENANT -->
<div class="card">
  <strong>Tenant</strong><br/>
  ${
            decryptedTenant
                ? `${decryptedTenant.firstName} ${decryptedTenant.lastName}<br/>
         ${decryptedTenant.email}<br/>
         ${decryptedTenant.phoneNumber}`
                : "—"
        }
</div>

<!-- SUMMARY -->
<div class="card">
  <table>
    <tr>
      <th>Billing Period</th>
      <th>Due Date</th>
      <th class="total">Total Due</th>
    </tr>
    <tr>
      <td>${formatDate(billingDate)}</td>
      <td>${dueDate.toLocaleDateString("en-CA")}</td>
      <td class="total">₱${php(totalDue)}</td>
    </tr>
  </table>
</div>

<!-- UTILITIES -->
<div class="card">
  <strong>Meter Readings</strong>
  <table>
    <tr>
      <th>Utility</th>
      <th>Previous</th>
      <th>Current</th>
      <th>Consumption</th>
      <th>Total</th>
    </tr>
    <tr>
      <td>Water</td>
      <td>${water?.previous_reading ?? "—"}</td>
      <td>${water?.current_reading ?? "—"}</td>
      <td>${water?.consumption ?? 0} m³</td>
      <td>₱${php(bill.total_water_amount)}</td>
    </tr>
    <tr>
      <td>Electricity</td>
      <td>${elec?.previous_reading ?? "—"}</td>
      <td>${elec?.current_reading ?? "—"}</td>
      <td>${elec?.consumption ?? 0} kWh</td>
      <td>₱${php(bill.total_electricity_amount)}</td>
    </tr>
  </table>
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
    } catch (err: any) {
        console.error("PDF ERROR:", err);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
