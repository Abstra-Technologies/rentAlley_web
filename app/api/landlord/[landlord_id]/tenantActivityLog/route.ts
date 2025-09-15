
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    try {
        const [rows]: any = await db.query(
            `
                SELECT
                    al.log_id,
                    al.action,
                    al.timestamp,
                    u.firstName,
                    u.lastName,
                    u.profilePicture,
                    t.tenant_id,
                    p.property_name,
                    un.unit_name
                FROM ActivityLog al
                         JOIN User u ON al.user_id = u.user_id
                         JOIN Tenant t ON u.user_id = t.user_id
                         JOIN LeaseAgreement la ON t.tenant_id = la.tenant_id
                         JOIN Unit un ON la.unit_id = un.unit_id
                         JOIN Property p ON un.property_id = p.property_id
                WHERE p.landlord_id = ?
                ORDER BY al.timestamp DESC
                LIMIT 50
            `,
            [params.landlord_id]
        );

        // Decrypt sensitive fields
        const decryptedLogs = rows.map((log: any) => {
            let decryptedFirstName = log.firstName;
            let decryptedLastName = log.lastName;
            let decryptedProfilePicture = log.profilePicture;

            try {
                if (log.firstName) {
                    decryptedFirstName = decryptData(
                        JSON.parse(log.firstName),
                        process.env.ENCRYPTION_SECRET!
                    );
                }
            } catch (err) {
                console.error(`Failed to decrypt firstName for log_id ${log.log_id}:`, err);
            }

            try {
                if (log.lastName) {
                    decryptedLastName = decryptData(
                        JSON.parse(log.lastName),
                        process.env.ENCRYPTION_SECRET!
                    );
                }
            } catch (err) {
                console.error(`Failed to decrypt lastName for log_id ${log.log_id}:`, err);
            }

            try {
                if (log.profilePicture) {
                    decryptedProfilePicture = decryptData(
                        JSON.parse(log.profilePicture),
                        process.env.ENCRYPTION_SECRET!
                    );
                }
            } catch (err) {
                console.error(`Failed to decrypt profilePicture for log_id ${log.log_id}:`, err);
            }

            return {
                ...log,
                firstName: decryptedFirstName,
                lastName: decryptedLastName,
                profilePicture: decryptedProfilePicture,
            };
        });

        return NextResponse.json(decryptedLogs, { status: 200 });
    } catch (error) {
        console.error("Error fetching tenant activity:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

