
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// implementation descripiton:
// if the tenant is coming from an invitsatiuon no more move-in chgecklist since they are currently renting.
//  else, move-in chgeclist wull show.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const agreement_id = searchParams.get("agreement_id");

    if (!agreement_id) {
        return NextResponse.json(
            { message: "agreement_id is required" },
            { status: 400 }
        );
    }

    try {
        // 🔹 Check if this lease came from an InviteCode no more checklist.
        const [inviteRows] = await db.query(
            `SELECT ic.id
       FROM InviteCode ic
       INNER JOIN Unit u ON ic.unitId = u.unit_id
       INNER JOIN LeaseAgreement la ON la.unit_id = u.unit_id
       WHERE la.agreement_id = ? 
         AND ic.status = 'USED'`,
            [agreement_id]
        );

        // @ts-ignore
        if (inviteRows && inviteRows.length > 0) {
            // If lease is tied to an invite → skip checklist
            return NextResponse.json(
                { showButton: false, status: "skipped" },
                { status: 200 }
            );
        }

        // 🔹 Otherwise normal checklist logic
        const [rows] = await db.query(
            "SELECT status FROM MoveInChecklist WHERE agreement_id = ?",
            [agreement_id]
        );

        if (!rows || (Array.isArray(rows) && rows.length === 0)) {
            return NextResponse.json({ showButton: true }, { status: 200 });
        }

        const checklist = Array.isArray(rows) ? rows[0] : rows;

        return NextResponse.json(
            { showButton: checklist.status !== "completed", status: checklist.status },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching move-in checklist status:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
