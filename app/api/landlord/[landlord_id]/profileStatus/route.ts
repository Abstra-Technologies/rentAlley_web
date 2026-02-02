import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ProfileStatus =
    | "incomplete"
    | "pending"
    | "rejected"
    | "verified";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ landlord_id: string }> }
) {
    const { landlord_id } = await params;

    console.log('landlord_id ver: ', landlord_id);


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

        /* ✅ No record = incomplete */
        if (!rows || rows.length === 0) {
            return NextResponse.json<{ status: ProfileStatus }>({
                status: "incomplete",
            });
        }

        const dbStatus = rows[0].status;

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
