import { NextRequest, NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export async function verifyAdmin(request: NextRequest) {
    try {
        const cookieHeader = request.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return { error: "Unauthorized", status: 401 };
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

        const { payload } = await jwtVerify(cookies.token, secretKey);

        if (!payload.admin_id) {
            return { error: "Invalid token", status: 401 };
        }

        return {
            admin_id: payload.admin_id as string,
            role: payload.role as string,
        };
    } catch (error) {
        return { error: "Invalid or expired token", status: 401 };
    }
}
