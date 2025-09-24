
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
                    u.firstName, u.lastName, u.companyName, u.birthDate, u.phoneNumber,
                    u.profilePicture, u.emailVerified,
                    u.address, l.citizenship,
                    lv.status AS verification_status
                FROM Landlord l
                         JOIN User u ON l.user_id = u.user_id
                         LEFT JOIN LandlordVerification lv
                                   ON l.landlord_id = lv.landlord_id
                WHERE l.landlord_id = ?
                ORDER BY lv.created_at DESC
                LIMIT 1
            `,
            [landlord_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { status: "incomplete", missingFields: [], completion: 0 },
                { status: 200 }
            );
        }

        const landlord = rows[0];

        // Required fields for "profile complete"
        const fieldMap: Record<string, any> = {
            firstName: landlord.firstName,
            lastName: landlord.lastName,
            companyName: landlord.companyName,
            birthDate: landlord.birthDate,
            phoneNumber: landlord.phoneNumber,
            profilePicture: landlord.profilePicture,
            address: landlord.address,
            citizenship: landlord.citizenship,
        };

        const missingFields = Object.entries(fieldMap)
            .filter(([_, value]) => !value || value === "")
            .map(([key]) => key);

        const totalFields = Object.keys(fieldMap).length;
        const filledFields = totalFields - missingFields.length;
        const completion = Math.round((filledFields / totalFields) * 100);

        // Determine status
        let status = "incomplete";

        if (missingFields.length > 0 || !landlord.emailVerified) {
            status = "incomplete";
        } else if (landlord.verification_status === "pending") {
            status = "pending";
        } else if (landlord.verification_status === "approved") {
            status = "verified"; // match your frontend
        } else if (landlord.verification_status === "rejected") {
            status = "rejected";
        } else {
            status = "incomplete"; // covers "not verified"
        }

        return NextResponse.json(
            { status, missingFields, completion },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error checking landlord completion:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
