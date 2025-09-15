

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { landlord_id: string } }
) {
    try {
        const [rows]: any = await db.query(
            `
      SELECT u.firstName, u.lastName, u.birthDate, u.phoneNumber, 
             u.profilePicture, u.emailVerified,
             l.address, l.citizenship,
             lv.status as verification_status
      FROM Landlord l
      JOIN User u ON l.user_id = u.user_id
      LEFT JOIN LandlordVerification lv 
             ON l.landlord_id = lv.landlord_id
      WHERE l.landlord_id = ?
      ORDER BY lv.created_at DESC
      LIMIT 1
      `,
            [params.landlord_id]
        );

        if (!rows.length) {
            return NextResponse.json({ status: "incomplete" }, { status: 200 });
        }

        const landlord = rows[0];
        const requiredFields = [
            landlord.firstName,
            landlord.lastName,
            landlord.birthDate,
            landlord.phoneNumber,
            landlord.profilePicture,
            landlord.address,
            landlord.citizenship,
        ];

        const allFilled = requiredFields.every((f) => f && f !== "");

        let status = "incomplete";

        if (!allFilled || !landlord.emailVerified) {
            status = "incomplete";
        } else if (landlord.verification_status === "pending") {
            status = "pending";
        } else if (landlord.verification_status === "approved") {
            status = "approved";
        } else if (landlord.verification_status === "rejected") {
            status = "rejected";
        }

        return NextResponse.json({ status }, { status: 200 });
    } catch (error) {
        console.error("Error checking landlord completion:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
