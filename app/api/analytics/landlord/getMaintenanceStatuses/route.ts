import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const landlordId = searchParams.get("landlord_id");

        if (!landlordId) {
            return NextResponse.json(
                { error: "Missing landlord_id" },
                { status: 400 }
            );
        }

        // Fetch all statuses for maint requests under this landlord
        const [rows]: any = await db.query(
            `
      SELECT mr.status
      FROM rentalley_db.MaintenanceRequest mr
      JOIN rentalley_db.Unit u 
          ON mr.unit_id = u.unit_id
      JOIN rentalley_db.Property p
          ON u.property_id = p.property_id
      WHERE p.landlord_id = ?
      `,
            [landlordId]
        );

        // Initialize all known statuses with 0
        const statusCounts: Record<string, number> = {
            "Pending": 0,
            "Approved": 0,
            "Scheduled": 0,
            "In-Progress": 0,
            "Completed": 0
        };

        // Count occurrences
        rows.forEach((row: any) => {
            const status = row.status;
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });

        return NextResponse.json(statusCounts);

    } catch (error) {
        console.error("Maintenance Status Error:", error);
        return NextResponse.json(
            { error: "Failed to load maintenance statuses." },
            { status: 500 }
        );
    }
}
