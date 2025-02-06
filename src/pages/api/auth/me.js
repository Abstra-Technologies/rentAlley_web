// import { jwtVerify } from "jose";
//
// export default async function handler(req, res) {
//     const token = req.cookies.token;
//
//     if (!token) {
//         console.error("Token not found in cookies.");
//         return res.status(401).json({ error: "Unauthorized" });
//     }
//
//     try {
//         const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//         const { payload } = await jwtVerify(token, secret);
//
//         // Return the decoded user details
//         res.status(200).json(payload);
//     } catch (error) {
//         console.error("Token verification failed:", error);
//         res.status(401).json({ error: "Invalid session" });
//     }
// }

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
        console.error("Token not found in cookies.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Decode JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload || (!payload.user_id && !payload.admin_id)) {
            return res.status(401).json({ error: "Invalid session" });
        }

        // Check if it's a regular user (Tenant or Landlord)
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
            t.tenant_id,
            l.landlord_id
        FROM User u
        LEFT JOIN Tenant t ON u.user_id = t.user_id
        LEFT JOIN Landlord l ON u.user_id = l.user_id
        WHERE u.user_id = ?
        `,
                [userId]
            );

            if (userRows.length > 0) {
                return res.status(200).json(userRows[0]); // Return Tenant or Landlord data
            }
        }

        // Check if it's a system admin
        if (payload.admin_id) {
            const adminId = payload.admin_id;

            const [adminRows] = await db.execute(
                `
        SELECT 
            a.admin_id,
            a.username,
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
                    userType: "admin",
                });
            }
        }

        // If no user or admin found, return an error
        return res.status(404).json({ error: "User not found" });

    } catch (error) {
        console.error("Token verification or database error:", error);
        res.status(401).json({ error: "Invalid session" });
    }
}
