import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    const { landlord_id } = params;

    try {
        const [rows]: any = await db.query(
            `
        SELECT
            lv.firstName,
            lv.lastName,
            lv.birthDate,
            lv.phoneNumber,
            lv.address,
            lv.occupation,
            lv.status AS verification_status
        FROM LandlordVerification lv
        WHERE lv.landlord_id = ?
        ORDER BY lv.created_at DESC
        LIMIT 1
      `,
            [landlord_id]
        );

        // 🧩 No verification record found
        if (!rows.length) {
            return NextResponse.json(
                { status: "incomplete", missingFields: [], completion: 0 },
                { status: 200 }
            );
        }

        const record = rows[0];

        // ✅ Required fields for completeness
        const fieldMap: Record<string, any> = {
            firstName: record.firstName,
            lastName: record.lastName,
            birthDate: record.birthDate,
            phoneNumber: record.phoneNumber,
            address: record.address,
            occupation: record.occupation,
        };

        const missingFields = Object.entries(fieldMap)
            .filter(([_, value]) => !value || value === "")
            .map(([key]) => key);

        const totalFields = Object.keys(fieldMap).length;
        const filledFields = totalFields - missingFields.length;
        const completion = Math.round((filledFields / totalFields) * 100);

        // ✅ Determine status logic
        let status = "incomplete";

        if (missingFields.length > 0) {
            status = "incomplete";
        } else if (record.verification_status === "pending") {
            status = "pending";
        } else if (record.verification_status === "approved") {
            status = "verified";
        } else if (record.verification_status === "rejected") {
            status = "rejected";
        }

        return NextResponse.json({ status, missingFields, completion }, { status: 200 });
    } catch (error) {
        console.error("Error checking landlord verification completeness:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
