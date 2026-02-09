import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const landlord_id = searchParams.get("landlord_id");
    const date = searchParams.get("date"); // OPTIONAL YYYY-MM-DD

    if (!landlord_id) {
        return NextResponse.json(
            { message: "Landlord ID is required" },
            { status: 400 }
        );
    }

    // ✅ Default to today if no date provided
    const targetDate =
        date ?? new Date().toISOString().split("T")[0];

    try {
        /* ===============================
           PROPERTY VISITS
        =============================== */
        const [visits] = await db.query(
            `
      SELECT 
        pv.visit_id,
        pv.visit_date,
        pv.visit_time,
        pv.status,
        u.unit_name,
        p.property_name
      FROM PropertyVisit pv
      JOIN Unit u ON pv.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND pv.visit_date = ?
      ORDER BY pv.visit_time ASC
      `,
            [landlord_id, targetDate]
        );

        /* ===============================
           MAINTENANCE REQUESTS
        =============================== */
        const [maintenance] = await db.query(
            `
      SELECT
        mr.request_id,
        mr.subject,
        mr.status,
        mr.created_at,
        u.unit_name,
        p.property_name
      FROM MaintenanceRequest mr
      JOIN Unit u ON mr.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
        AND DATE(mr.created_at) = ?
      ORDER BY mr.created_at ASC
      `,
            [landlord_id, targetDate]
        );

        return NextResponse.json(
            {
                date: targetDate,
                propertyVisits: visits,
                maintenanceRequests: maintenance,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching landlord calendar events:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
