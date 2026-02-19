import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({
        message: "Logged out successfully",
    });

    /* 🔥 Clear USER token */
    response.cookies.set("token", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });

    /* 🔥 Clear ADMIN token */
    response.cookies.set("admin_token", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });

    return response;
}

export function GET() {
    return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
    );
}
