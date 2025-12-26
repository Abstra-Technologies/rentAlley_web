import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";
import { parse } from "cookie";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

/* ======================================================
   SAFE EMAIL DECRYPT
====================================================== */
const safeDecryptEmail = (value: any, encryptionKey: string) => {
    if (!value) return null;

    try {
        if (typeof value === "string" && value.trim().startsWith("{")) {
            return decryptData(JSON.parse(value), encryptionKey);
        }
        return value; // plain text
    } catch {
        return value;
    }
};

/* ======================================================
   GET CO-ADMIN DETAILS
====================================================== */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ admin_id: string }> }
) {
    try {
        const { admin_id } = await params;

        const cookies = parse(req.headers.get("cookie") || "");
        if (!cookies.token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { payload }: any = await jwtVerify(
            cookies.token,
            new TextEncoder().encode(process.env.JWT_SECRET!)
        );

        const loggedAdminId = payload.admin_id;

        const [admins]: any = await db.query(
            "SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?",
            [admin_id]
        );

        if (!admins || admins.length === 0) {
            return NextResponse.json({ message: "Co-admin not found" }, { status: 404 });
        }

        const encryptionKey = process.env.ENCRYPTION_SECRET!;

        const admin = {
            ...admins[0],
            email: safeDecryptEmail(admins[0].email, encryptionKey),
        };

        const [activityLog]: any = await db.query(
            "SELECT action, timestamp FROM ActivityLog WHERE admin_id = ? ORDER BY timestamp DESC",
            [admin_id]
        );

        if (loggedAdminId) {
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [loggedAdminId, `Viewed Co-Admin: ${admins[0].username}`]
            );
        }

        return NextResponse.json(
            { success: true, admin, activityLog },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching admin details:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

/* ======================================================
   UPDATE CO-ADMIN
====================================================== */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ admin_id: string }> }
) {
    try {
        const { admin_id } = await params;
        const body = await req.json();
        const { username, password, email, role, status } = body;

        const cookies = parse(req.headers.get("cookie") || "");
        if (!cookies.token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { payload }: any = await jwtVerify(
            cookies.token,
            new TextEncoder().encode(process.env.JWT_SECRET!)
        );

        const loggedAdminId = payload.admin_id;

        let query = "UPDATE Admin SET";
        const paramsArray: any[] = [];
        const logActions: string[] = [];

        const add = (field: string, value: any, log: string) => {
            if (paramsArray.length > 0) query += ",";
            query += ` ${field} = ?`;
            paramsArray.push(value);
            logActions.push(log);
        };

        if (username) add("username", username, `Updated username to ${username}`);
        if (email) add("email", email, `Updated email`);
        if (role) add("role", role, `Updated role to ${role}`);
        if (status) add("status", status, `Updated status to ${status}`);

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            add("password", hashedPassword, "Updated password (hashed)");
        }

        if (paramsArray.length === 0) {
            return NextResponse.json(
                { success: false, message: "No updates provided" },
                { status: 400 }
            );
        }

        query += " WHERE admin_id = ?";
        paramsArray.push(admin_id);

        const [updateResult]: any = await db.query(query, paramsArray);

        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ message: "Co-admin not found" }, { status: 404 });
        }

        await db.query(
            "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
            [loggedAdminId, `Updated Co-admin (${admin_id}): ${logActions.join(", ")}`]
        );

        return NextResponse.json(
            { success: true, message: "Co-admin updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating co-admin:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
