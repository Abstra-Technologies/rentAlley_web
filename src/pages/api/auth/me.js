
import { jwtVerify } from "jose";
import mysql from "mysql2/promise";

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default async function handler(req, res) {
    const token = req.cookies.token;

    if (!token) {
        console.error("❌ [User Fetch] Token not found in cookies.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload || (!payload.user_id && !payload.admin_id)) {
            return res.status(401).json({ error: "Invalid session" });
        }

        if (payload.user_id) {
            const userId = payload.user_id;
            const [userRows] = await db.execute(
                `
                SELECT 
                    u.user_id,
                    u.firstName,
                    u.lastName,
                    u.email,
                    u.userType,
                    u.userType,
                    u.profilePicture,
                    u.is_2fa_enabled,
                    u.phoneNumber,
                    u.birthDate,
                    t.tenant_id,
                    l.landlord_id,
                    l.verified,
                    l.is_trial_used
                FROM User u
                LEFT JOIN Tenant t ON u.user_id = t.user_id
                LEFT JOIN Landlord l ON u.user_id = l.user_id
                WHERE u.user_id = ?
                `,
                [userId]
            );

            if (userRows.length > 0) {
                const user = userRows[0];

                if (user.landlord_id) {
                    const [subscriptionRows] = await db.execute(
                        `
                        SELECT 
                           *
                        FROM Subscription
                        WHERE landlord_id = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                        `,
                        [user.landlord_id]
                    );

                    user.subscription = subscriptionRows.length > 0 ? subscriptionRows[0] : null;
                    user.is_trial_used = user.is_trial_used ? true : false;
                }

                return res.status(200).json(user);
            }
        }

        if (payload.admin_id) {
            const adminId = payload.admin_id;

            const [adminRows] = await db.execute(
                `
                SELECT 
                    a.admin_id,
                    a.username,
                    a.first_name,
                    a.last_name,
                    a.profile_picture,
                    a.email,
                    a.role,
                    a.status
                FROM Admin a
                WHERE a.admin_id = ?
                `,
                [adminId]
            );

            if (adminRows.length > 0) {
                return res.status(200).json({
                    admin_id: adminRows[0].admin_id,
                    username: adminRows[0].username,
                    email: adminRows[0].email,
                    role: adminRows[0].role,
                    status: adminRows[0].status,
                    first_name: adminRows[0].first_name,
                    last_name:adminRows[0].last_name,
                    userType: "admin",
                    profile_picture: adminRows[0].profile_picture,
                });
            }
        }

        // If no user or admin found, return an error
        return res.status(404).json({ error: "User not found" });

    } catch (error) {
        console.error("❌ [User Fetch] Token verification or database error:", error);
        res.status(401).json({ error: "Invalid session" });
    }
}
