import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, userType } = body;

        if (!user_id || !userType) {
            return NextResponse.json(
                { error: "Missing user_id or userType" },
                { status: 400 }
            );
        }

        /* =================================================
           LANDLORD
        ================================================= */
        if (userType === "landlord") {
            const [landlordRows]: any[] = await db.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (!landlordRows.length) {
                return NextResponse.json(
                    { error: "Landlord account not found." },
                    { status: 400 }
                );
            }

            const landlordId = landlordRows[0].landlord_id;

            const [leaseRows]: any[] = await db.query(
                `
        SELECT COUNT(*) AS active_lease_count
        FROM LeaseAgreement l
        JOIN Unit u ON l.unit_id = u.unit_id
        JOIN Property p ON u.property_id = p.property_id
        WHERE p.landlord_id = ? AND l.status = 'active'
        `,
                [landlordId]
            );

            const activeLeaseCount = leaseRows[0]?.active_lease_count || 0;

            if (activeLeaseCount > 0) {
                return NextResponse.json(
                    { error: "You cannot deactivate your account. You have active leases." },
                    { status: 400 }
                );
            }

            // Deactivate properties, units, subscriptions
            await db.query(
                `UPDATE Property SET status = 'inactive' WHERE landlord_id = ?`,
                [landlordId]
            );

            await db.query(
                `
        UPDATE Unit u
        JOIN Property p ON u.property_id = p.property_id
        SET u.status = 'inactive'
        WHERE p.landlord_id = ?
        `,
                [landlordId]
            );

            await db.query(
                `UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?`,
                [landlordId]
            );

            await db.query(
                `UPDATE User SET status = 'deactivated', updatedAt = NOW() WHERE user_id = ?`,
                [user_id]
            );

            const response = NextResponse.json(
                { message: "Your account has been deactivated." },
                { status: 200 }
            );

            response.cookies.set("token", "", {
                httpOnly: true,
                path: "/",
                maxAge: 0,
                sameSite: "strict",
            });

            return response;
        }

        /* =================================================
           TENANT
        ================================================= */
        if (userType === "tenant") {
            const [tenantRows]: any[] = await db.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
                [user_id]
            );

            if (!tenantRows.length) {
                return NextResponse.json(
                    { error: "Tenant account not found." },
                    { status: 400 }
                );
            }

            const tenantId = tenantRows[0].tenant_id;

            const [leaseRows]: any[] = await db.query(
                `
        SELECT COUNT(*) AS active_lease_count
        FROM LeaseAgreement
        WHERE tenant_id = ? AND status = 'active'
        `,
                [tenantId]
            );

            const activeLeaseCount = leaseRows[0]?.active_lease_count || 0;

            if (activeLeaseCount > 0) {
                return NextResponse.json(
                    { error: "You cannot deactivate your account. You have an active lease." },
                    { status: 400 }
                );
            }

            await db.query(
                `UPDATE User SET status = 'deactivated', updatedAt = NOW() WHERE user_id = ?`,
                [user_id]
            );

            const response = NextResponse.json(
                { message: "Your account has been deactivated." },
                { status: 200 }
            );

            response.cookies.set("token", "", {
                httpOnly: true,
                path: "/",
                maxAge: 0,
                sameSite: "strict",
            });

            return response;
        }

        /* =================================================
           INVALID USER TYPE
        ================================================= */
        return NextResponse.json(
            { error: "Invalid userType" },
            { status: 400 }
        );
    } catch (error) {
        console.error("❌ Error deactivating account:", error);
        return NextResponse.json(
            { error: "Failed to deactivate account." },
            { status: 500 }
        );
    }
}
