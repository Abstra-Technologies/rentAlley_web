import { db } from "@/lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { decryptData } from "@/crypto/encrypt";
import { NextRequest, NextResponse } from "next/server";

/* ======================================================
   AUTH: GET CURRENT ADMIN FROM TOKEN
====================================================== */
async function getCurrentAdminId(req: NextRequest): Promise<string> {
    const cookies = parse(req.headers.get("cookie") || "");

    if (!cookies.token) {
        throw new Error("Unauthorized");
    }

    const decoded = jwt.verify(
        cookies.token,
        process.env.JWT_SECRET as string
    ) as any;

    if (!decoded?.admin_id) {
        throw new Error("Invalid token");
    }

    return decoded.admin_id;
}

/* ======================================================
   GET CO-ADMIN DETAILS
====================================================== */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ admin_id: string }> }
) {
    try {
        const { admin_id } = await params;
        const viewerAdminId = await getCurrentAdminId(req);

        const [rows]: any = await db.query(
            `
      SELECT
        admin_id,
        username,
        email,
        role,
        status,
        profile_picture,
        permissions
      FROM Admin
      WHERE admin_id = ?
      `,
            [admin_id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { success: false, message: "Co-admin not found" },
                { status: 404 }
            );
        }

        const encryptionKey = process.env.ENCRYPTION_SECRET!;
        const admin = {
            ...rows[0],
            email: rows[0].email
                ? decryptData(JSON.parse(rows[0].email), encryptionKey)
                : null,
            permissions: rows[0].permissions
                ? rows[0].permissions.split(",").map((p: string) => p.trim())
                : [],
        };

        const [activityLog]: any = await db.query(
            `
      SELECT action, timestamp
      FROM ActivityLog
      WHERE admin_id = ?
      ORDER BY timestamp DESC
      `,
            [admin_id]
        );

        await db.query(
            `
      INSERT INTO ActivityLog (admin_id, action, timestamp)
      VALUES (?, ?, NOW())
      `,
            [viewerAdminId, `Viewed Co-admin: ${admin.username}`]
        );

        return NextResponse.json(
            { success: true, admin, activityLog },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[GET CO-ADMIN DETAILS]", error.message);
        return NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}

/* ======================================================
   UPDATE CO-ADMIN DETAILS
====================================================== */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ admin_id: string }> }
) {
    try {
        const { admin_id } = await params;
        const currentAdminId = await getCurrentAdminId(req);
        const body = await req.json();

        if (admin_id === currentAdminId) {
            return NextResponse.json(
                { success: false, message: "You cannot modify yourself" },
                { status: 403 }
            );
        }

        let sql = "UPDATE Admin SET";
        const values: any[] = [];
        const logs: string[] = [];

        const add = (field: string, value: any, log: string) => {
            if (values.length > 0) sql += ",";
            sql += ` ${field} = ?`;
            values.push(value);
            logs.push(log);
        };

        if (body.username) add("username", body.username, `username → ${body.username}`);
        if (body.email) add("email", body.email, "email updated");
        if (body.role) add("role", body.role, `role → ${body.role}`);
        if (body.status) add("status", body.status, `status → ${body.status}`);
        if (body.permissions)
            add("permissions", body.permissions.join(","), "permissions updated");

        if (values.length === 0) {
            return NextResponse.json(
                { success: false, message: "No updates provided" },
                { status: 400 }
            );
        }

        sql += " WHERE admin_id = ?";
        values.push(admin_id);

        const [result]: any = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "Co-admin not found" },
                { status: 404 }
            );
        }

        await db.query(
            `
      INSERT INTO ActivityLog (admin_id, action, timestamp)
      VALUES (?, ?, NOW())
      `,
            [
                currentAdminId,
                `Updated Co-admin (${admin_id}): ${logs.join(", ")}`,
            ]
        );

        return NextResponse.json(
            { success: true, message: "Co-admin updated successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[PATCH CO-ADMIN DETAILS]", error.message);
        return NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}

/* ======================================================
   DELETE CO-ADMIN
====================================================== */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ admin_id: string }> }
) {
    try {
        const { admin_id } = await params;
        const currentAdminId = await getCurrentAdminId(req);

        if (admin_id === currentAdminId) {
            return NextResponse.json(
                { success: false, message: "You cannot delete yourself" },
                { status: 403 }
            );
        }

        const [result]: any = await db.query(
            "DELETE FROM Admin WHERE admin_id = ?",
            [admin_id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { success: false, message: "Co-admin not found" },
                { status: 404 }
            );
        }

        await db.query(
            `
      INSERT INTO ActivityLog (admin_id, action, timestamp)
      VALUES (?, ?, NOW())
      `,
            [currentAdminId, `Deleted Co-admin with ID: ${admin_id}`]
        );

        return NextResponse.json(
            { success: true, message: "Co-admin deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[DELETE CO-ADMIN]", error.message);
        return NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}
