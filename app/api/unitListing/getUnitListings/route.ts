import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { decryptData } from "@/crypto/encrypt";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const property_id = searchParams.get("property_id");
    const unit_id = searchParams.get("unit_id");

    let connection;

    try {
        connection = await db.getConnection();

        let query = `
            SELECT
                u.*,
                la.agreement_id AS lease_agreement_id,
                la.start_date,
                la.end_date,
                la.billing_due_day,
                la.status AS lease_status,
                CASE
                    WHEN DAY(CURDATE()) <= la.billing_due_day
                        THEN DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()), '-', la.billing_due_day))
                    ELSE DATE(CONCAT(YEAR(CURDATE()), '-', MONTH(CURDATE()) + 1, '-', la.billing_due_day))
                    END AS next_due_date,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM LeaseAgreement lap
                        WHERE lap.unit_id = u.unit_id AND lap.status = 'pending'
                    )
                        THEN 1 ELSE 0
                    END AS hasPendingLease,
                usr.firstName AS enc_firstName,
                usr.lastName AS enc_lastName,
                DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') AS last_updated
            FROM Unit u
                     LEFT JOIN LeaseAgreement la
                               ON la.unit_id = u.unit_id AND la.status = 'active'
                     LEFT JOIN Tenant t
                               ON la.tenant_id = t.tenant_id
                     LEFT JOIN User usr
                               ON t.user_id = usr.user_id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (unit_id) {
            query += ` AND u.unit_id = ?`;
            params.push(unit_id);
        }

        if (property_id) {
            query += ` AND u.property_id = ?`;
            params.push(property_id);
        }

        const [rows] = await connection.execute(query, params);
        const result: any[] = [];

        for (const row of rows as any[]) {
            const decryptedRow = { ...row };
            let tenant_name = null;

            try {
                if (row.enc_firstName) {
                    const parsedFirst = JSON.parse(row.enc_firstName);
                    const decryptedFirst = decryptData(parsedFirst, process.env.ENCRYPTION_SECRET);
                    decryptedRow.enc_firstName = decryptedFirst;
                }

                if (row.enc_lastName) {
                    const parsedLast = JSON.parse(row.enc_lastName);
                    const decryptedLast = decryptData(parsedLast, process.env.ENCRYPTION_SECRET);
                    decryptedRow.enc_lastName = decryptedLast;
                }

                if (decryptedRow.enc_firstName || decryptedRow.enc_lastName) {
                    tenant_name = `${decryptedRow.enc_firstName || ""} ${decryptedRow.enc_lastName || ""}`.trim();
                }

                console.log("Decrypted tenant:", tenant_name);
            } catch (decryptionError) {
                console.error(`Decryption failed for unit ID ${row.unit_id}:`, decryptionError);
                decryptedRow.enc_firstName = null;
                decryptedRow.enc_lastName = null;
                tenant_name = null;
            }

            result.push({
                ...decryptedRow,
                tenant_name,
            });
        }

        if (unit_id && result.length === 0) {
            return new Response(
                JSON.stringify({ error: "No Units found for this Property" }),
                { status: 404 }
            );
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error fetching unit listings:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch unit listings" }),
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
