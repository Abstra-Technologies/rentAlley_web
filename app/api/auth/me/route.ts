// app/api/auth/me/route.ts

import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { decryptData } from "@/crypto/encrypt";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
if (!ENCRYPTION_SECRET) {
    throw new Error("ENCRYPTION_SECRET is required");
}

/* ======================================================
   SAFE DECRYPT HELPER
====================================================== */
const safeDecrypt = (value: string | null | undefined): string | null => {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value);
        return decryptData(parsed, ENCRYPTION_SECRET);
    } catch (err) {
        console.error("Decryption failed for field:", err);
        return null;
    }
};

/* ======================================================
   CACHED USER QUERY — ONLY EXISTING COLUMNS
====================================================== */
const getCachedUser = unstable_cache(
    async (userId: string) => {
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
    },
    ["auth-user"],
    { revalidate: 60, tags: ["auth-user"] }
);

/* ======================================================
   ROUTE HANDLER
====================================================== */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "No session token provided" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        let payload: any;

        try {
            ({ payload } = await jwtVerify(token, secret));
        } catch {
            return NextResponse.json({ error: "Session expired or invalid token" }, { status: 401 });
        }

        /* ==================== USER SESSION ==================== */
        if (payload?.user_id) {
            const rawUser = await getCachedUser(payload.user_id);

            if (!rawUser) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            if (["suspended", "deactivated", "archived"].includes(rawUser.status)) {
                return NextResponse.json(
                    { error: `Account is ${rawUser.status}. Contact support.` },
                    { status: 403 }
                );
            }

            const user = {
                user_id: rawUser.user_id,
                firstName: safeDecrypt(rawUser.firstName),
                lastName: safeDecrypt(rawUser.lastName),
                companyName: rawUser.companyName,
                email: safeDecrypt(rawUser.email),
                profilePicture: safeDecrypt(rawUser.profilePicture),
                phoneNumber: safeDecrypt(rawUser.phoneNumber),
                birthDate: safeDecrypt(rawUser.birthDate),
                address: safeDecrypt(rawUser.address),
                occupation: safeDecrypt(rawUser.occupation),
                citizenship: safeDecrypt(rawUser.citizenship),
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
                is_verified: rawUser.landlord_id ? !!rawUser.is_verified : null,
                is_trial_used: rawUser.landlord_id ? !!rawUser.is_trial_used : null,
            };

            /* ==================== SUBSCRIPTION (ONLY EXISTING COLUMNS) ==================== */
            if (user.landlord_id) {
                const [subs]: any[] = await db.execute(
                    `
          SELECT
            subscription_id,
            plan_name,
            plan_code,
            start_date,
            end_date,
            payment_status,
            request_reference_number,
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

        /* ==================== ADMIN SESSION (NO CHANGES NEEDED) ==================== */
        // ... (admin part remains the same as before)

        return NextResponse.json({ error: "Invalid session payload" }, { status: 401 });
    } catch (error) {
        console.error("AUTH /me ERROR:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}