import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const conn = await db.getConnection();

    try {
        const { inviteCode } = await req.json();

        if (!inviteCode) {
            return NextResponse.json(
                { error: "Missing invite code." },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        /* ===============================
           1️⃣ Validate invite
        =============================== */
        const [inviteRows]: any = await conn.query(
            `
      SELECT unitId, status
      FROM InviteCode
      WHERE code = ?
      FOR UPDATE
      `,
            [inviteCode]
        );

        const invite = inviteRows[0];

        if (!invite) {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite not found." },
                { status: 404 }
            );
        }

        if (invite.status !== "PENDING") {
            await conn.rollback();
            return NextResponse.json(
                { error: "Invite already processed." },
                { status: 409 }
            );
        }

        /* ===============================
           2️⃣ Mark invite as REJECTED
        =============================== */
        await conn.query(
            `
      UPDATE InviteCode
      SET status = 'REJECTED'
      WHERE code = ?
      `,
            [inviteCode]
        );

        /* ===============================
           3️⃣ Release unit
        =============================== */
        await conn.query(
            `
      UPDATE Unit
      SET status = 'unoccupied',
          updated_at = CURRENT_TIMESTAMP
      WHERE unit_id = ?
      `,
            [invite.unitId]
        );

        await conn.commit();

        return NextResponse.json({
            success: true,
            message: "Invitation rejected. Unit is now available.",
        });

    } catch (error) {
        console.error("Reject invite error:", error);
        await conn.rollback();
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
