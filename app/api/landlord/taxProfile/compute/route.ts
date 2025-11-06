import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");
    const passedTaxType = searchParams.get("tax_type");
    const passedFilingType = searchParams.get("filing_type");

    if (!landlord_id)
        return NextResponse.json({ error: "Missing landlord_id" }, { status: 400 });

    try {
        // 1️⃣ Fetch landlord profile for fallback tax & filing types
        const [[profile]]: any = await db.query(
            "SELECT tax_type, filing_type FROM LandlordTaxProfile WHERE landlord_id = ? LIMIT 1",
            [landlord_id]
        );

        // ✅ Use dynamic parameters if provided
        const taxType = passedTaxType || profile?.tax_type || "percentage";
        const filingType = passedFilingType || profile?.filing_type || "monthly";

        // 2️⃣ Determine tax rate
        let taxRate = 0.0;
        switch (taxType) {
            case "vat":
                taxRate = 0.12;
                break;
            case "percentage":
                taxRate = 0.03;
                break;
            default:
                taxRate = 0.0;
        }

        // 3️⃣ Compute the correct date range
        const now = new Date();
        let startDate: Date;
        let endDate = new Date(now);

        if (filingType === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filingType === "quarterly") {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            endDate = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
        } else {
            // annual
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        }

        // Convert to MySQL YYYY-MM-DD
        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];

        // 4️⃣ Query billing total within range
        const [[income]]: any = await db.query(
            `
      SELECT SUM(b.total_amount_due) AS gross_income
      FROM Billing b
      JOIN Unit u ON b.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND b.billing_period BETWEEN ? AND ?
        AND b.status IN ('paid', 'finalized')
      `,
            [landlord_id, start, end]
        );

        const gross_income = income?.gross_income || 0;
        const tax_due = gross_income * taxRate;

        // 5️⃣ Format the period label
        let periodLabel = "";
        if (filingType === "monthly") {
            periodLabel = now.toLocaleString("default", { month: "long", year: "numeric" });
        } else if (filingType === "quarterly") {
            const q = Math.floor(now.getMonth() / 3) + 1;
            periodLabel = `Q${q} ${now.getFullYear()}`;
        } else {
            periodLabel = `${now.getFullYear()} (Annual)`;
        }

        return NextResponse.json({
            period: periodLabel,
            gross_income,
            tax_due,
            tax_type: taxType,
            filing_type: filingType,
            start_period: start,
            end_period: end,
            message: "Tax computation successful (dynamic mode supported)",
        });
    } catch (error: any) {
        console.error("❌ Tax computation error:", error);
        return NextResponse.json({ error: "Failed to compute tax" }, { status: 500 });
    }
}
