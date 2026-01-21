import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ProfileStatus =
    | "incomplete"
    | "pending"
    | "rejected"
    | "verified";

export async function GET(
    req: Request,
    context: { params: { landlord_id: string } }
) {
    const { landlord_id } = context.params;

    if (!landlord_id) {
        return NextResponse.json(
            { error: "Invalid landlord_id" },
            { status: 400 }
        );
    }

    try {
        const [rows]: any = await db.query(
            `
      SELECT status
      FROM LandlordVerification
      WHERE landlord_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
            [landlord_id]
        );

        /** ✅ NO RECORD → SHOW VERIFY LANDLORD */
        if (!rows || rows.length === 0) {
            return NextResponse.json<{
                status: ProfileStatus;
            }>({ status: "incomplete" });
        }

        const dbStatus = rows[0].status;

        /** ✅ NORMALIZE DB → UI STATUS */
        let status: ProfileStatus;

        switch (dbStatus) {
            case "pending":
                status = "pending";
                break;
            case "rejected":
                status = "rejected";
                break;
            case "approved":
                status = "verified";
                break;
            default:
                status = "incomplete";
        }

        return NextResponse.json({ status });
    } catch (error) {
        console.error("Landlord profile status error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
