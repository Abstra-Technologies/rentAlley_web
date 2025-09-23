import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust this path to match your db import

export async function POST(req: NextRequest) {
    console.log("Verify 2FA API called");
    
    try {
        const body = await req.json();
        const { user_id, verification_code } = body;

        if (!user_id || !verification_code) {
            return NextResponse.json(
                { error: "User ID and verification code are required." },
                { status: 400 }
            );
        }

        // Simple validation - 6 digits
        if (!/^\d{6}$/.test(verification_code)) {
            return NextResponse.json(
                { error: "Verification code must be 6 digits." },
                { status: 400 }
            );
        }

        console.log("Verification code received:", verification_code);

        // Enable 2FA for the user
        await db.query(
            "UPDATE User SET is_2fa_enabled = 1 WHERE user_id = ?",
            [user_id]
        );

        console.log("2FA enabled for user:", user_id);

        return NextResponse.json({
            message: "2FA enabled successfully!",
            success: true
        });
        
    } catch (error) {
        console.error("Error in verify-2fa:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}