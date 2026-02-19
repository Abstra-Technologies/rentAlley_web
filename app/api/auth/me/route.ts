// app/api/auth/me/route.ts

import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

/* ======================================================
   FORCE DYNAMIC (CRITICAL)
====================================================== */
export const dynamic = "force-dynamic";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ENCRYPTION_SECRET) throw new Error("ENCRYPTION_SECRET is required");
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

/* ======================================================
   SAFE DECRYPT
====================================================== */
const safeDecrypt = (value?: string | null): string | null => {
    if (!value) return null;
    try {
        // @ts-ignore
        return decryptData(JSON.parse(value), ENCRYPTION_SECRET);
    } catch {
        return null;
    }
};

/* ======================================================
   ADMIN PERMISSIONS PARSER
====================================================== */
const parseAdminPermissions = (value?: string | null): string[] | null => {
    if (!value) return null;

    try {
        const trimmed = value.trim();

        if (trimmed.startsWith("[")) {
            return JSON.parse(trimmed);
        }

        return trimmed
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
    } catch {
        return null;
    }
};

/* ======================================================
   USER QUERY (NO CACHE)
====================================================== */
const getUser = async (userId: string) => {
    const [rows]: any[] = await db.execute(
        `
    SELECT
      u.user_id,
      u.firstName,
      u.lastName,
      u.companyName,
      u.email,
      u.profilePicture,
      u.phoneNumber,
      u.birthDate,
      u.civil_status,
      u.occupation,
      u.citizenship,
      u.address,
      u.userType,
      u.is_2fa_enabled,
      u.points,
      u.emailVerified,
      u.status,
      u.google_id,
      u.createdAt,
      u.updatedAt,
      t.tenant_id,
      l.landlord_id,
      l.is_verified,
      l.is_trial_used
    FROM rentalley_db.User u
    LEFT JOIN rentalley_db.Tenant t ON u.user_id = t.user_id
    LEFT JOIN rentalley_db.Landlord l ON u.user_id = l.user_id
    WHERE u.user_id = ?
    LIMIT 1
    `,
        [userId]
    );

    return rows?.[0] || null;
};

/* ======================================================
   ADMIN QUERY (NO CACHE)
====================================================== */
const getAdmin = async (adminId: string) => {
    const [rows]: any[] = await db.execute(
        `
    SELECT
      admin_id,
      username,
      first_name,
      last_name,
      email,
      role,
      status,
      profile_picture,
      permissions
    FROM rentalley_db.Admin
    WHERE admin_id = ?
    LIMIT 1
    `,
        [adminId]
    );

    return rows?.[0] || null;
};

/* ======================================================
   ROUTE HANDLER
====================================================== */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "No session token provided" },
                { status: 401 }
            );
        }

        /* ================= JWT VERIFY ================= */
        let payload: any;

        try {
            ({ payload } = await jwtVerify(
                token,
                new TextEncoder().encode(JWT_SECRET)
            ));

        } catch (err) {
            console.error("[AUTH /me] JWT VERIFY FAILED:", err);

            return NextResponse.json(
                { error: "Session expired or invalid token" },
                { status: 401 }
            );
        }

        /* ================= USER SESSION ================= */
        if (payload?.user_id) {
            const rawUser = await getUser(payload.user_id);

            if (!rawUser) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            if (
                ["suspended", "deactivated", "archived"].includes(rawUser.status)
            ) {
                return NextResponse.json(
                    { error: `Account is ${rawUser.status}` },
                    { status: 403 }
                );
            }

            const user: any = {
                user_id: rawUser.user_id,
                firstName: safeDecrypt(rawUser.firstName),
                lastName: safeDecrypt(rawUser.lastName),
                companyName: rawUser.companyName,
                email: safeDecrypt(rawUser.email),
                profilePicture: safeDecrypt(rawUser.profilePicture),
                phoneNumber: safeDecrypt(rawUser.phoneNumber),
                birthDate: safeDecrypt(rawUser.birthDate),
                address: rawUser.address,
                occupation: rawUser.occupation,
                citizenship: rawUser.citizenship,
                civil_status: rawUser.civil_status,
                userType: rawUser.userType,
                is_2fa_enabled: !!rawUser.is_2fa_enabled,
                points: rawUser.points || 0,
                status: rawUser.status,
                google_id: rawUser.google_id,
                createdAt: rawUser.createdAt,
                updatedAt: rawUser.updatedAt,
                tenant_id: rawUser.tenant_id || null,
                landlord_id: rawUser.landlord_id || null,
                is_verified: rawUser.landlord_id
                    ? !!rawUser.is_verified
                    : null,
                is_trial_used: rawUser.landlord_id
                    ? !!rawUser.is_trial_used
                    : null,
            };


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
            is_active
          FROM rentalley_db.Subscription
          WHERE landlord_id = ?
          ORDER BY created_at DESC
          LIMIT 1
          `,
                    [user.landlord_id]
                );

                user.subscription = subs?.[0] || null;
            }

            return NextResponse.json(user, { status: 200 });
        }

        /* ================= ADMIN SESSION ================= */
        if (payload?.admin_id) {
            const rawAdmin = await getAdmin(payload.admin_id);


            if (!rawAdmin) {
                return NextResponse.json(
                    { error: "Admin not found" },
                    { status: 404 }
                );
            }

            if (rawAdmin.status === "disabled") {
                return NextResponse.json(
                    { error: "Admin account disabled" },
                    { status: 403 }
                );
            }

            const admin = {
                admin_id: rawAdmin.admin_id,
                username: rawAdmin.username,
                first_name: safeDecrypt(rawAdmin.first_name),
                last_name: safeDecrypt(rawAdmin.last_name),
                email: safeDecrypt(rawAdmin.email),
                role: rawAdmin.role,
                status: rawAdmin.status,
                profile_picture: rawAdmin.profile_picture,
                permissions: parseAdminPermissions(rawAdmin.permissions),
            };

            return NextResponse.json(admin, { status: 200 });
        }

        console.warn("[AUTH /me] INVALID PAYLOAD:", payload);

        return NextResponse.json(
            { error: "Invalid session payload" },
            { status: 401 }
        );
    } catch (error) {
        console.error("[AUTH /me] UNHANDLED ERROR:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
