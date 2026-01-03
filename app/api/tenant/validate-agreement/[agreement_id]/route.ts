import { NextResponse } from "next/server";
import { parse } from "cookie";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

// To Check if the lease belongs to the right tenant.

export async function GET(
    req: Request,
    context: { params: Promise<{ agreement_id: string }> }
) {
    try {
        const { agreement_id } = await context.params;

        /* ---------------- AUTH ---------------- */
        const cookieHeader = req.headers.get("cookie");
        const cookies = cookieHeader ? parse(cookieHeader) : null;

        if (!cookies?.token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(cookies.token, secret);

        const userId = payload.user_id as string;
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        /* ---------------- PARAM ---------------- */
        if (!agreement_id || typeof agreement_id !== "string") {
            return NextResponse.json(
                { message: "Invalid agreement id" },
                { status: 400 }
            );
        }

        /* ---------------- RESOLVE TENANT ---------------- */
        const [tenantRows]: any = await db.query(
            `
            SELECT tenant_id
            FROM Tenant
            WHERE user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (!tenantRows?.length) {
            return NextResponse.json(
                { message: "Tenant profile not found" },
                { status: 403 }
            );
        }

        const tenantId = tenantRows[0].tenant_id;

        /* ---------------- OWNERSHIP CHECK ---------------- */
        const [leaseRows]: any = await db.query(
            `
            SELECT agreement_id, status
            FROM LeaseAgreement
            WHERE agreement_id = ?
              AND tenant_id = ?
            LIMIT 1
            `,
            [agreement_id, tenantId]
        );

        if (!leaseRows?.length) {
            return NextResponse.json(
                { message: "Forbidden" },
                { status: 403 }
            );
        }

        const allowedStatuses = ["active", "draft", "expired"];

        if (!allowedStatuses.includes(leaseRows[0].status)) {
            return NextResponse.json(
                { message: "Lease access not allowed" },
                { status: 403 }
            );
        }

        /* ---------------- SUCCESS ---------------- */
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[VALIDATE AGREEMENT ERROR]", err);
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }
}
