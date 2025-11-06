import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db"; // Reusing your db connection

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "No session token provided" }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        let payload;
        try {
            ({ payload } = await jwtVerify(token, secret));
        } catch (err) {
            return NextResponse.json({ error: "Session expired or invalid token" }, { status: 401 });
        }

        if (!payload || (!payload.user_id && !payload.admin_id)) {
            return NextResponse.json({ error: "Invalid session payload" }, { status: 401 });
        }

        // Handle regular user
        if (payload.user_id) {
            const userId = payload.user_id;
            const [userRows]: any[] = await db.execute(
                `
                    SELECT
                        u.user_id,
                        u.firstName,
                        u.lastName,
                        u.email,
                        u.userType,
                        u.profilePicture,
                        u.is_2fa_enabled,
                        u.phoneNumber,
                        u.birthDate,
                        u.points,
                        u.civil_status,
                        u.occupation,
                        u.citizenship,
                        u.address,
                        t.tenant_id,
                        l.landlord_id,
                        l.is_verified,
                        l.is_trial_used
                    FROM User u
                             LEFT JOIN Tenant t ON u.user_id = t.user_id
                             LEFT JOIN Landlord l ON u.user_id = l.user_id
                    WHERE u.user_id = ?
                `,
                [userId]
            );

            if (!userRows || userRows.length === 0) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const user = userRows[0];

            if (user.status === "suspended" || user.status === "deactivated") {
                return NextResponse.json(
                    { error: `Account is ${user.status}. Please contact support.` },
                    { status: 403 }
                );
            }

            // If landlord, fetch subscription
            if (user.landlord_id) {
                const [subscriptionRows]: any[] = await db.execute(
                    `
                        SELECT
                            subscription_id,
                            plan_name,
                            start_date,
                            end_date,
                            payment_status,
                            is_trial,
                            amount_paid,
                            is_active
                        FROM Subscription
                        WHERE landlord_id = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                    `,
                    [user.landlord_id]
                );

                user.subscription = subscriptionRows.length > 0 ? subscriptionRows[0] : null;
                user.is_trial_used = !!user.is_trial_used;
            }

            return NextResponse.json(user, { status: 200 });
        }

        // Handle admin user
        if (payload.admin_id) {
            const adminId = payload.admin_id;
            const [adminRows]: any[] = await db.execute(
                `
                    SELECT
                        a.admin_id,
                        a.username,
                        a.first_name,
                        a.last_name,
                        a.profile_picture,
                        a.email,
                        a.role,
                        a.status,
                        a.permissions
                    FROM Admin a
                    WHERE a.admin_id = ?
                `,
                [adminId]
            );

            if (!adminRows || adminRows.length === 0) {
                return NextResponse.json({ error: "Admin not found" }, { status: 404 });
            }

            const admin = adminRows[0];

            if (admin.status === "suspended" || admin.status === "deactivated") {
                return NextResponse.json(
                    { error: `Account is ${admin.status}. Please contact support.` },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                {
                    admin_id: admin.admin_id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    status: admin.status,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    profile_picture: admin.profile_picture,
                    permissions: admin.permissions,
                },
                { status: 200 }
            );
        }

        return NextResponse.json({ error: "Invalid session payload" }, { status: 401 });
    } catch (error: any) {
        console.error("Error validating session:", error);
        return NextResponse.json(
            { error: `Database connection error during session validation: ${error.message}` },
            { status: 500 }
        );
    }
}