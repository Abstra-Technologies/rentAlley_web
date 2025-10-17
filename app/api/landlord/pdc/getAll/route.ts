import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // MySQL pool connection

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/landlord/pdc/getAll?landlord_id=1&page=1&limit=10&status=pending
 *
 * Optional query params:
 * - landlord_id (required)
 * - page (default 1)
 * - limit (default 10)
 * - status (optional: pending, cleared, bounced, replaced)
 * - lease_id (optional)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const landlord_id = searchParams.get("landlord_id");
        const lease_id = searchParams.get("lease_id");
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        if (!landlord_id) {
            return NextResponse.json(
                { error: "landlord_id is required" },
                { status: 400 }
            );
        }

        // ✅ Base query with JOINs to fetch PDC + Lease + Unit info
        let baseQuery = `
      SELECT 
        pdc.pdc_id,
        pdc.lease_id,
        pdc.check_number,
        pdc.bank_name,
        pdc.amount,
        pdc.due_date,
        pdc.status,
        pdc.uploaded_image_url,
        pdc.notes,
        pdc.created_at,
        u.unit_name,
        pr.property_name,
        la.landlord_id
      FROM PostDatedCheck AS pdc
      INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
      INNER JOIN Unit AS u ON l.unit_id = u.unit_id
      INNER JOIN Property AS pr ON u.property_id = pr.property_id
      INNER JOIN Landlord AS la ON pr.landlord_id = la.landlord_id
      WHERE la.landlord_id = ?
    `;

        const queryParams: any[] = [landlord_id];

        // ✅ Optional filters
        if (lease_id) {
            baseQuery += ` AND pdc.lease_id = ?`;
            queryParams.push(lease_id);
        }

        if (status) {
            baseQuery += ` AND pdc.status = ?`;
            queryParams.push(status);
        }

        baseQuery += ` ORDER BY pdc.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // ✅ Execute parameterized query
        const [rows]: any = await db.query(baseQuery, queryParams);

        // ✅ Count total rows for pagination
        const [countResult]: any = await db.query(
            `
      SELECT COUNT(*) AS total
      FROM PostDatedCheck AS pdc
      INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
      INNER JOIN Unit AS u ON l.unit_id = u.unit_id
      INNER JOIN Property AS pr ON u.property_id = pr.property_id
      WHERE pr.landlord_id = ?
      ${lease_id ? " AND pdc.lease_id = ?" : ""}
      ${status ? " AND pdc.status = ?" : ""}
      `,
            [landlord_id, ...(lease_id ? [lease_id] : []), ...(status ? [status] : [])]
        );

        const total = countResult[0]?.total || 0;

        return NextResponse.json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("❌ Error fetching PDCs:", error);
        return NextResponse.json(
            { error: "Failed to fetch post-dated checks", details: error.message },
            { status: 500 }
        );
    }
}
