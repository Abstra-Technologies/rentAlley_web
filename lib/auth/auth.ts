import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

/* ===============================
   Session User Type
================================ */
export interface SessionUser {
    user_id: string;
    tenant_id: string | null;
    landlord_id: string | null;
    userType: "tenant" | "landlord" | "admin";
    session_id: string | null;
}

/* ===============================
   Get Authenticated Session User
================================ */
export async function getSessionUser(
    _req?: Request
): Promise<SessionUser | null> {
    try {
        /* ===============================
           1. Read JWT from cookie
        ================================ */
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return null;

        /* ===============================
           2. Verify JWT
        ================================ */
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET!
        );

        const { payload } = await jwtVerify(token, secret);

        const user_id = payload?.user_id as string | undefined;
        const session_id = (payload?.jti as string) || null;

        if (!user_id) return null;

        /* ===============================
           3. Fetch user + role context
        ================================ */
        const [rows]: any = await db.query(
            `
            SELECT
                u.user_id,
                u.userType,
                t.tenant_id,
                l.landlord_id
            FROM rentalley_db.User u
            LEFT JOIN rentalley_db.Tenant t ON t.user_id = u.user_id
            LEFT JOIN rentalley_db.Landlord l ON l.user_id = u.user_id
            WHERE u.user_id = ?
            LIMIT 1
            `,
            [user_id]
        );

        const user = rows?.[0];
        if (!user) return null;

        /* ===============================
           4. Return normalized session
        ================================ */
        return {
            user_id: user.user_id,
            tenant_id: user.tenant_id ?? null,
            landlord_id: user.landlord_id ?? null,
            userType: user.userType,
            session_id,
        };
    } catch (err) {
        console.error("[AUTH] Invalid session", err);
        return null;
    }
}
