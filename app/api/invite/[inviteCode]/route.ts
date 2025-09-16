
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { decryptData } from "@/crypto/encrypt";

const InviteCodeSchema = z.string().min(6);
const encryptionSecret = process.env.ENCRYPTION_SECRET!;

export async function GET(
    req: NextRequest,
    { params }: { params: { inviteCode: string } }
) {
    const { inviteCode } = params;
    console.log("inviteCode", inviteCode);

    const parse = InviteCodeSchema.safeParse(inviteCode);
    if (!parse.success) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    try {
        const [rows]: any[] = await db.query(
            `
                SELECT i.id,
                       i.unitId,
                       i.email,
                       i.expiresAt,
                       u.unit_name AS unit_name,
                       p.property_name AS property_name,
                       (
                           SELECT pp.photo_url
                           FROM PropertyPhoto pp
                           WHERE pp.property_id = p.property_id
                           ORDER BY pp.created_at ASC
                           LIMIT 1
                       ) AS property_photo
                FROM InviteCode i
                         JOIN Unit u ON i.unitId = u.unit_id
                         JOIN Property p ON u.property_id = p.property_id
                WHERE i.code = ?
            `,
            [inviteCode]
        );

        if (!rows.length) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        const invite = rows[0];

        // ✅ Decrypt photo if exists
        if (invite.property_photo) {
            try {
                const encryptedData = JSON.parse(invite.property_photo);
                invite.property_photo = decryptData(encryptedData, encryptionSecret);
            } catch (decryptionError) {
                console.error("Invite photo decrypt error:", decryptionError);
                invite.property_photo = null;
            }
        }

        // ✅ Check if expired
        const now = new Date();
        if (new Date(invite.expiresAt) < now) {
            await db.query("DELETE FROM InviteCode WHERE id = ?", [invite.id]);
            return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
        }

        return NextResponse.json({ invite });
    } catch (err) {
        console.error("Error fetching invite:", err);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
