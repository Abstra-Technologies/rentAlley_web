import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @endpoint GET /api/analytics/landlord/getMaintenanceStatuses
 * @used_by pendingMaintenanceWidget
 * @inputs landlord_id (query)
 * @outputs status counts
 * @notes unit_id and property_id may be NULL
 */

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

        /**
         * IMPORTANT:
         * - unit_id can be NULL
         * - property_id can be NULL
         * - landlord match can come from EITHER path
         */
        const [rows]: any = await db.query(
            `
            SELECT mr.status
            FROM MaintenanceRequest mr
            LEFT JOIN Unit u
                ON mr.unit_id = u.unit_id
            LEFT JOIN Property p_unit
                ON u.property_id = p_unit.property_id
            LEFT JOIN Property p_direct
                ON mr.property_id = p_direct.property_id
            WHERE
                p_unit.landlord_id = ?
                OR p_direct.landlord_id = ?
            `,
            [landlordId, landlordId]
        );

        // Normalize statuses (use DB values, not UI labels)
        const statusCounts: Record<string, number> = {
            pending: 0,
            approved: 0,
            scheduled: 0,
            "in-progress": 0,
            completed: 0,
        };

        rows.forEach((row: any) => {
            const status = row.status?.toLowerCase();
            if (status && statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });

        return NextResponse.json({
            success: true,
            data: statusCounts,
        });
    } catch (error) {
        console.error("[MAINTENANCE_STATUS_WIDGET_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to load maintenance statuses." },
            { status: 500 }
        );
    }
}
