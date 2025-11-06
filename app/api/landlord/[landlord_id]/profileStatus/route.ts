import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt"; // ✅ follow your existing project convention

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    const { landlord_id } = params;

    try {
        const [rows]: any = await db.query(
            `
                SELECT
                    u.firstName,
                    u.lastName,
                    u.birthDate,
                    u.phoneNumber,
                    u.address,
                    u.occupation,
                    lv.status AS verification_status
                FROM LandlordVerification lv
                         JOIN Landlord l ON lv.landlord_id = l.landlord_id
                         JOIN User u ON l.user_id = u.user_id
                WHERE lv.landlord_id = ?
                ORDER BY lv.created_at DESC
                LIMIT 1
            `,
            [landlord_id]
        );

        // 🧩 No record found
        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { status: "incomplete", missingFields: [], completion: 0 },
                { status: 200 }
            );
        }

        const record = rows[0];

        // ✅ Apply decryption following your project’s SupportRequest handler style
        const decryptedRecord = {
            firstName: record.firstName
                ? decryptData(JSON.parse(record.firstName), process.env.ENCRYPTION_SECRET)
                : "",
            lastName: record.lastName
                ? decryptData(JSON.parse(record.lastName), process.env.ENCRYPTION_SECRET)
                : "",
            birthDate: record.birthDate
                ? decryptData(JSON.parse(record.birthDate), process.env.ENCRYPTION_SECRET)
                : "",
            phoneNumber: record.phoneNumber
                ? decryptData(JSON.parse(record.phoneNumber), process.env.ENCRYPTION_SECRET)
                : "",
            address: record.address
                ? decryptData(JSON.parse(record.address), process.env.ENCRYPTION_SECRET)
                : "",
            occupation: record.occupation
                ? decryptData(JSON.parse(record.occupation), process.env.ENCRYPTION_SECRET)
                : "",
            verification_status: record.verification_status,
        };

        // ✅ Compute completeness
        const fieldMap: Record<string, any> = {
            firstName: decryptedRecord.firstName,
            lastName: decryptedRecord.lastName,
            birthDate: decryptedRecord.birthDate,
            phoneNumber: decryptedRecord.phoneNumber,
            address: decryptedRecord.address,
            occupation: decryptedRecord.occupation,
        };

        const missingFields = Object.entries(fieldMap)
            .filter(([_, value]) => !value || value === "")
            .map(([key]) => key);

        const totalFields = Object.keys(fieldMap).length;
        const filledFields = totalFields - missingFields.length;
        const completion = Math.round((filledFields / totalFields) * 100);

        // ✅ Determine status
        let status = "incomplete";
        if (missingFields.length > 0) status = "incomplete";
        else if (decryptedRecord.verification_status === "pending") status = "pending";
        else if (decryptedRecord.verification_status === "approved") status = "verified";
        else if (decryptedRecord.verification_status === "rejected") status = "rejected";

        return NextResponse.json({ status, missingFields, completion }, { status: 200 });
    } catch (error) {
        console.error("Error checking landlord verification completeness:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
