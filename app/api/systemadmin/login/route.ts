// app/api/systemadmin/login/route.ts

import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { SignJWT } from "jose";
import nodeCrypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.debug("[ADMIN LOGIN] Request started");

    try {
        const body = await req.json();
        console.debug("[ADMIN LOGIN] Request body:", body);

        const { login, password } = body;

        if (!login || !password) {
            console.debug("[ADMIN LOGIN] Missing credentials. Login:", !!login, "Password:", !!password);
            return NextResponse.json(
                { error: "Username or email and password are required." },
                { status: 400 }
            );
        }

        let user: any = null;

        // Search by email (using hash)
        if (login.includes("@")) {
            const emailHash = nodeCrypto.createHash("sha256").update(login.toLowerCase()).digest("hex");
            console.debug("[ADMIN LOGIN] Searching by email hash:", emailHash);

            const [userByEmail]: any = await db.query(
                "SELECT admin_id, username, password, email, email_hash, role, status, permissions, profile_picture FROM Admin WHERE email_hash = ?",
                [emailHash]
            );

            console.debug("[ADMIN LOGIN] Email query result count:", userByEmail?.length || 0);
            user = userByEmail?.[0] || null;
        }
        // Search by username
        else {
            console.debug("[ADMIN LOGIN] Searching by username:", login);

            const [userByUsername]: any = await db.query(
                "SELECT admin_id, username, password, email, email_hash, role, status, permissions, profile_picture FROM Admin WHERE username = ?",
                [login]
            );

            console.debug("[ADMIN LOGIN] Username query result count:", userByUsername?.length || 0);
            user = userByUsername?.[0] || null;
        }

        if (!user) {
            console.debug("[ADMIN LOGIN] User not found for login:", login);
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        console.debug("[ADMIN LOGIN] User found:", {
            admin_id: user.admin_id,
            username: user.username,
            role: user.role,
            status: user.status,
        });

        if (user.status === "disabled") {
            console.debug("[ADMIN LOGIN] Account is disabled for admin_id:", user.admin_id);
            return NextResponse.json(
                { error: "Your account has been disabled. Please contact support." },
                { status: 403 }
            );
        }

        // Password verification
        const isMatch = await bcrypt.compare(password, user.password);
        console.debug("[ADMIN LOGIN] Password match:", isMatch);

        if (!isMatch) {
            console.debug("[ADMIN LOGIN] Invalid password attempt for admin_id:", user.admin_id);
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // JWT Token Generation
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        if (!process.env.JWT_SECRET) {
            console.debug("[ADMIN LOGIN] JWT_SECRET is missing!");
        }

        console.debug("[ADMIN LOGIN] Generating JWT for admin_id:", user.admin_id);

        const token = await new SignJWT({
            admin_id: user.admin_id,
            username: user.username,
            role: user.role,
            email: user.email,
            permissions: user.permissions
                ? user.permissions.split(",").map((p: string) => p.trim())
                : [],
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(user.admin_id.toString())
            .sign(secret);

        console.debug("[ADMIN LOGIN] JWT generated successfully. Length:", token.length);
        console.debug("[ADMIN LOGIN] JWT payload includes admin_id:", user.admin_id);

        // Response with cookie
        const response = NextResponse.json(
            {
                message: "Login successful.",
                admin: {
                    admin_id: user.admin_id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                },
            },
            { status: 200 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 2 * 60 * 60, // 2 hours
        });

        console.debug("[ADMIN LOGIN] Cookie 'token' set on response");
        console.debug("[ADMIN LOGIN] Cookie settings:", {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7200,
        });

        // Log activity
        try {
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, ?)",
                [user.admin_id, "Admin logged in", new Date().toISOString()]
            );
            console.debug("[ADMIN LOGIN] Activity logged successfully");
        } catch (logError) {
            console.debug("[ADMIN LOGIN] Failed to log activity:", logError);
        }

        console.debug("[ADMIN LOGIN] Login successful for:", user.username);
        return response;
    } catch (error: any) {
        console.debug("[ADMIN LOGIN] Unexpected error:", error);
        console.error("[ADMIN LOGIN ERROR]", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}