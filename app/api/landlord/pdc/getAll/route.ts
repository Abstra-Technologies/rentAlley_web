import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt"; // follow same model logic

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

        // ✅ Query base data
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
        la.landlord_id,
        tu.firstName AS encrypted_firstName,
        tu.lastName AS encrypted_lastName
      FROM PostDatedCheck AS pdc
      INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
      INNER JOIN Unit AS u ON l.unit_id = u.unit_id
      INNER JOIN Property AS pr ON u.property_id = pr.property_id
      INNER JOIN Landlord AS la ON pr.landlord_id = la.landlord_id
      INNER JOIN Tenant AS t ON l.tenant_id = t.tenant_id
      INNER JOIN User AS tu ON t.user_id = tu.user_id
      WHERE la.landlord_id = ?
    `;

        const queryParams: any[] = [landlord_id];

        if (lease_id) {
            baseQuery += ` AND pdc.lease_id = ?`;
            queryParams.push(lease_id);
        }

        if (status && status !== "all") {
            baseQuery += ` AND pdc.status = ?`;
            queryParams.push(status);
        }

        baseQuery += ` ORDER BY pdc.created_at DESC LIMIT ? OFFSET ?`;
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
            } catch (err) {
                console.warn("⚠️ Failed to decrypt tenant name:", err.message);
            }

            return {
                ...row,
                tenant_name: `${firstName} ${lastName}`.trim() || "Unknown",
            };
        });

        // ✅ Count total filtered rows for pagination
        const [countResult]: any = await db.query(
            `
        SELECT COUNT(*) AS total
        FROM PostDatedCheck AS pdc
        INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
        INNER JOIN Unit AS u ON l.unit_id = u.unit_id
        INNER JOIN Property AS pr ON u.property_id = pr.property_id
        WHERE pr.landlord_id = ?
        ${lease_id ? " AND pdc.lease_id = ?" : ""}
        ${status && status !== "all" ? " AND pdc.status = ?" : ""}
      `,
            [landlord_id, ...(lease_id ? [lease_id] : []), ...(status && status !== "all" ? [status] : [])]
        );

        const total = countResult[0]?.total || 0;

        // ✅ Count total PDCs (ignore status)
        const [totalPDCCountResult]: any = await db.query(
            `
        SELECT COUNT(*) AS totalCount
        FROM PostDatedCheck AS pdc
        INNER JOIN LeaseAgreement AS l ON pdc.lease_id = l.agreement_id
        INNER JOIN Unit AS u ON l.unit_id = u.unit_id
        INNER JOIN Property AS pr ON u.property_id = pr.property_id
        WHERE pr.landlord_id = ?
        ${lease_id ? " AND pdc.lease_id = ?" : ""}
      `,
            [landlord_id, ...(lease_id ? [lease_id] : [])]
        );

        const totalPDCCount = totalPDCCountResult[0]?.totalCount || 0;

        // ✅ Return unified response
        return NextResponse.json({
            data: decryptedRows,
            totalCount: totalPDCCount,
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
            { error: `Database query failed: ${error.message}` },
            { status: 500 }
        );
    }
}
