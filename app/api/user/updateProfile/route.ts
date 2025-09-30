
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptData } from "@/crypto/encrypt";

export async function POST(req: NextRequest) {
    try {
        const { userId, firstName, lastName, dob } = await req.json();

        if (!userId || !firstName || !lastName || !dob) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ Validate DOB (18+)
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasBirthdayPassed =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
                today.getDate() >= birthDate.getDate());
        if (!hasBirthdayPassed) age--;

        if (age < 18) {
            return NextResponse.json(
                { error: "User must be at least 18 years old" },
                { status: 400 }
            );
        }

        // 🔐 Encrypt before storing
        const firstNameEnc = JSON.stringify(
            await encryptData(firstName, process.env.ENCRYPTION_SECRET!)
        );
        const lastNameEnc = JSON.stringify(
            await encryptData(lastName, process.env.ENCRYPTION_SECRET!)
        );
        const dobEnc = JSON.stringify(
            await encryptData(dob, process.env.ENCRYPTION_SECRET!)
        );

        await db.execute(
            `UPDATE User
             SET firstName = ?, lastName = ?, birthDate = ?, updatedAt = UTC_TIMESTAMP()
             WHERE user_id = ?`,
            [firstNameEnc, lastNameEnc, dobEnc, userId]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("❌ Error updating user profile:", err);
        return NextResponse.json(
            { error: "Failed to update user profile" },
            { status: 500 }
        );
    }
}
