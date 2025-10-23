import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function PUT(req: NextRequest) {
    try {
        const { user_id, currentPassword, newPassword } = await req.json();

        // 1️⃣ Validate input
        if (!user_id || !currentPassword || !newPassword) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 }
            );
        }

        // 2️⃣ Fetch user record
        const [rows]: any = await db.query(
            `SELECT user_id, password FROM User WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        const user = rows[0];

        // 3️⃣ Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: "Current password is incorrect." },
                { status: 401 }
            );
        }
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { message: "New password cannot be the same as your current password." },
                { status: 400 }
            );
        }

        // 5️⃣ Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query(`UPDATE User SET password = ? WHERE user_id = ?`, [
            hashedPassword,
            user_id,
        ]);

        // 6️⃣ Success
        return NextResponse.json(
            { message: "Password updated successfully." },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ Change password error:", error);
        return NextResponse.json(
            { message: "Internal server error.", error: error.message },
            { status: 500 }
        );
    }
}
