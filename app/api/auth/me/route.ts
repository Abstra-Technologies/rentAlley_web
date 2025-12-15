import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/* ======================================================
   CACHED DB QUERIES (JWT IS NEVER CACHED)
====================================================== */

const getCachedUser = unstable_cache(
    async (userId: string) => {
        const [rows]: any[] = await db.execute(
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
                u.status,
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

        return rows?.[0] || null;
    },
    ["auth-user"],
    { revalidate: 60, tags: ["auth-user"] }
);

const getCachedAdmin = unstable_cache(
    async (adminId: string) => {
        const [rows]: any[] = await db.execute(
            `
            SELECT
                admin_id,
                username,
                first_name,
                last_name,
                profile_picture,
                email,
                role,
                status,
                permissions
            FROM Admin
            WHERE admin_id = ?
            `,
            [adminId]
        );

        return rows?.[0] || null;
    },
    ["auth-admin"],
    { revalidate: 60, tags: ["auth-admin"] }
);

/* ======================================================
   ROUTE HANDLER
====================================================== */

export async function GET(req: NextRequest) {
    try {
        /* -------------------------
           1️⃣ READ COOKIE (ASYNC!)
        -------------------------- */
        const cookieStore = await cookies(); // ✅ REQUIRED IN NEXT 16
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "No session token provided" },
                { status: 401 }
            );
        }

        /* -------------------------
           2️⃣ VERIFY JWT
        -------------------------- */
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        let payload: any;

        try {
            ({ payload } = await jwtVerify(token, secret));
        } catch {
            return NextResponse.json(
                { error: "Session expired or invalid token" },
                { status: 401 }
            );
        }

        /* ======================================================
           3️⃣ USER SESSION
        ====================================================== */
        if (payload?.user_id) {
            const user = await getCachedUser(payload.user_id);

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            if (["suspended", "deactivated"].includes(user.status)) {
                return NextResponse.json(
                    { error: `Account is ${user.status}. Contact support.` },
                    { status: 403 }
                );
            }

            /* Fetch subscription (NOT cached) */
            if (user.landlord_id) {
                const [subs]: any[] = await db.execute(
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

                user.subscription = subs?.[0] || null;
                user.is_trial_used = !!user.is_trial_used;
            }

            return NextResponse.json(user, { status: 200 });
        }

        /* ======================================================
           4️⃣ ADMIN SESSION
        ====================================================== */
        if (payload?.admin_id) {
            const admin = await getCachedAdmin(payload.admin_id);

            if (!admin) {
                return NextResponse.json(
                    { error: "Admin not found" },
                    { status: 404 }
                );
            }

            if (admin.status !== "active") {
                return NextResponse.json(
                    { error: `Account is ${admin.status}.` },
                    { status: 403 }
                );
            }

            return NextResponse.json(admin, { status: 200 });
        }

        return NextResponse.json(
            { error: "Invalid session payload" },
            { status: 401 }
        );
    } catch (error) {
        console.error("AUTH /me ERROR:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
