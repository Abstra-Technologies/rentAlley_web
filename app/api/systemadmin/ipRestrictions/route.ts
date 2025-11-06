import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";
import { parse } from "cookie";

export async function GET(req: NextRequest) {
    try {
        // 🔐 Parse cookies and verify JWT
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies || !cookies.token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        const currentLoggedAdmin = payload.admin_id;
        const role = payload.role;

        if (role !== "super-admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        // ✅ Fetch all allowed IPs
        const [rows]: any = await db.query(
            "SELECT * FROM IpAddresses ORDER BY created_at DESC"
        );

        return NextResponse.json({
            success: true,
            message: "Fetched successfully",
            data: rows,
        });
    } catch (err) {
        console.error("GET /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // 🔐 Parse cookies and verify JWT
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies || !cookies.token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        const currentLoggedAdmin = payload.admin_id;
        const role = payload.role;

        if (role !== "super-admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        // 🧩 Extract request body
        const { ip_address, label } = await req.json();
        if (!ip_address) {
            return NextResponse.json({ success: false, message: "IP address is required" }, { status: 400 });
        }

        await db.query(
            "INSERT INTO IpAddresses (ip_address, label, added_by_admin_id) VALUES (?, ?, ?)",
            [ip_address, label || null, currentLoggedAdmin]
        );

        return NextResponse.json({ success: true, message: "IP added successfully" });
    } catch (err) {
        console.error("POST /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // 🔐 Parse cookies and verify JWT
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies || !cookies.token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        const currentLoggedAdmin = payload.admin_id;
        const role = payload.role;

        if (role !== "super-admin") {
            return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
        }

        // 🧩 Extract ID from query params
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Missing ID parameter" }, { status: 400 });
        }

        await db.query("DELETE FROM IpAddresses WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: "IP deleted successfully" });
    } catch (err) {
        console.error("DELETE /ipRestrictions error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
