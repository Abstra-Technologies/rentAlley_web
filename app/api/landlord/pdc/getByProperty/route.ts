import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @route GET /api/landlord/pdc/getByProperty
 * @desc Fetch all Post-Dated Checks (PDCs) tied to a specific property.
 *       Includes decrypted tenant names, pagination, and status filtering.
 * @query
 *   - property_id (required): number → property to filter by
 *   - page (optional): number → current page (default 1)
 *   - limit (optional): number → records per page (default 10)
 *   - status (optional): string → 'pending', 'cleared', 'bounced', 'replaced', or 'all'
 * @returns
 *   {
 *     data: [...],
 *     pagination: { total, page, limit, totalPages },
 *     totalCount: number
 *   }
 * @usedAt
 *   - components/landlord/pdc/PDCManagementPerProperty.tsx
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const status = searchParams.get("status");
        const offset = (page - 1) * limit;

        if (!property_id) {
            return NextResponse.json(
                { error: "property_id is required" },
                { status: 400 }
            );
        }

        // ✅ Base query for PDC records
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
                tu.firstName AS encrypted_firstName,
                tu.lastName AS encrypted_lastName
            FROM PostDatedCheck AS pdc
            INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
            INNER JOIN Unit AS u ON l.unit_id = u.unit_id
            INNER JOIN Property AS pr ON u.property_id = pr.property_id
            INNER JOIN Tenant AS t ON l.tenant_id = t.tenant_id
            INNER JOIN User AS tu ON t.user_id = tu.user_id
            WHERE pr.property_id = ?
        `;

        const queryParams: any[] = [property_id];

        if (status && status !== "all") {
            baseQuery += ` AND pdc.status = ?`;
            queryParams.push(status);
        }

        baseQuery += ` ORDER BY pdc.due_date ASC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [rows]: any = await db.query(baseQuery, queryParams);

        // ✅ Decrypt tenant names per record
        const decryptedRows = rows.map((row: any) => {
            let firstName = "";
            let lastName = "";

            try {
                if (row.encrypted_firstName)
                    firstName = decryptData(
                        JSON.parse(row.encrypted_firstName),
                        process.env.ENCRYPTION_SECRET
                    );
                if (row.encrypted_lastName)
                    lastName = decryptData(
                        JSON.parse(row.encrypted_lastName),
                        process.env.ENCRYPTION_SECRET
                    );
            } catch (err: any) {
                console.warn("⚠️ Failed to decrypt tenant name:", err.message);
            }

            return {
                ...row,
                tenant_name: `${firstName} ${lastName}`.trim() || "Unknown",
            };
        });

        // ✅ Count filtered total for pagination
        const [countResult]: any = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM PostDatedCheck AS pdc
            INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
            INNER JOIN Unit AS u ON l.unit_id = u.unit_id
            INNER JOIN Property AS pr ON u.property_id = pr.property_id
            WHERE pr.property_id = ?
            ${status && status !== "all" ? " AND pdc.status = ?" : ""}
        `,
            [property_id, ...(status && status !== "all" ? [status] : [])]
        );

        const total = countResult[0]?.total || 0;

        // ✅ Count total PDCs overall (ignore status filter)
        const [totalCountResult]: any = await db.query(
            `
            SELECT COUNT(*) AS totalCount
            FROM PostDatedCheck AS pdc
            INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
            INNER JOIN Unit AS u ON l.unit_id = u.unit_id
            INNER JOIN Property AS pr ON u.property_id = pr.property_id
            WHERE pr.property_id = ?
        `,
            [property_id]
        );

        const totalCount = totalCountResult[0]?.totalCount || 0;

        // ✅ Return response
        return NextResponse.json({
            data: decryptedRows,
            totalCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("❌ Error fetching PDCs by property:", error);
        return NextResponse.json(
            { error: `Database query failed: ${error.message}` },
            { status: 500 }
        );
    }
}
