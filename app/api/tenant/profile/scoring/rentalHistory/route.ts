import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns tenant's lease history and computed metrics.
 * Matches schema: rentalley_db.LeaseAgreement, Unit, Property.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
        return NextResponse.json({ error: "Missing tenant_id" }, { status: 400 });
    }

    try {
        const [rows]: any[] = await db.query(
            `
      SELECT 
        la.agreement_id,
        la.unit_id,
        la.start_date,
        la.end_date,
        la.status,
        la.rent_amount,
        u.unit_name,
        p.property_name,
        p.city,
        p.province
      FROM rentalley_db.LeaseAgreement la
      JOIN rentalley_db.Unit u ON la.unit_id = u.unit_id
      JOIN rentalley_db.Property p ON u.property_id = p.property_id
      WHERE la.tenant_id = ?
      ORDER BY la.start_date DESC;
      `,
            [tenant_id]
        );

        if (!rows.length) {
            return NextResponse.json({
                tenant_id,
                lease_count: 0,
                active_leases: 0,
                avg_duration_months: 0,
                total_rent_value: 0,
                data: [],
                message: "No rental history found for this tenant.",
            });
        }

        const durations = rows.map((r: any) => {
            const start = new Date(r.start_date);
            const end = r.end_date ? new Date(r.end_date) : new Date();
            return (
                (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth())
            );
        });

        const avgDuration = durations.length
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const activeLeases = rows.filter((r: any) => r.status === "active").length;
        const totalRent = rows.reduce(
            (sum: number, r: any) => sum + Number(r.rent_amount || 0),
            0
        );

        return NextResponse.json({
            tenant_id,
            lease_count: rows.length,
            active_leases: activeLeases,
            avg_duration_months: Math.round(avgDuration),
            total_rent_value: Number(totalRent.toFixed(2)),
            data: rows,
        });
    } catch (error: any) {
        console.error("❌ Error fetching rental history:", error);
        return NextResponse.json(
            { error: "Database error", details: error.message },
            { status: 500 }
        );
    }
}
