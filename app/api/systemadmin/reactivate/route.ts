import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, userType } = body;

        if (!user_id || !userType) {
            return NextResponse.json(
                { error: "Missing user_id or userType" },
                { status: 400 }
            );
        }

        /* ======================================================
           LANDLORD REACTIVATION
        ====================================================== */
        if (userType === "landlord") {
            const [landlordRows]: any = await db.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ? LIMIT 1`,
                [user_id]
            );

            if (!landlordRows.length) {
                return NextResponse.json(
                    { error: "Landlord account not found." },
                    { status: 404 }
                );
            }

            await db.query(
                `UPDATE User SET status = 'active' WHERE user_id = ?`,
                [user_id]
            );

            return NextResponse.json(
                {
                    success: true,
                    message: "Landlord account reactivated successfully.",
                },
                { status: 200 }
            );
        }

        /* ======================================================
           TENANT REACTIVATION
        ====================================================== */
        if (userType === "tenant") {
            const [tenantRows]: any = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ? LIMIT 1`,
                [user_id]
            );

            if (!tenantRows.length) {
                return NextResponse.json(
                    { error: "Tenant account not found." },
                    { status: 404 }
                );
            }

            await db.query(
                `UPDATE User SET status = 'active' WHERE user_id = ?`,
                [user_id]
            );

            return NextResponse.json(
                {
                    success: true,
                    message: "Tenant account reactivated successfully.",
                },
                { status: 200 }
            );
        }

        /* ======================================================
           INVALID ROLE
        ====================================================== */
        return NextResponse.json(
            { error: "Invalid userType provided." },
            { status: 400 }
        );

    } catch (error) {
        console.error("[ACCOUNT_REACTIVATE_ERROR]", error);

        return NextResponse.json(
            { error: "Failed to reactivate account." },
            { status: 500 }
        );
    }
}

/* ======================================================
   BLOCK OTHER METHODS
====================================================== */
export function GET() {
    return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
    );
}
