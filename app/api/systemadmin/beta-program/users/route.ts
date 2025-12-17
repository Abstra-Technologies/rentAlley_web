import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * @route GET /api/admin/beta-program/users
 * @desc  Fetch ALL beta program applicants (Admin only)
 */
export async function GET(_req: NextRequest) {
    try {
        const [rows]: any = await db.query(
            `
            SELECT
                b.beta_id,
                b.landlord_id,
                b.full_name,
                b.email,
                b.properties_count,
                b.avg_units_per_property,
                b.region,
                b.province,
                b.city,
                b.status,
                b.applied_at,
                b.approved_at,
                b.rejection_reason,

                a.username AS approved_by_admin
            FROM BetaUsers b
            LEFT JOIN Admin a
                ON b.approved_by = a.admin_id
            ORDER BY b.applied_at DESC
            `
        );

        return NextResponse.json({
            users: rows,
            total: rows.length,
        });
    } catch (error) {
        console.error("[ADMIN_BETA_USERS_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to fetch beta users" },
            { status: 500 }
        );
    }
}
