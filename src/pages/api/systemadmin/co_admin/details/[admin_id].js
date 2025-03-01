import { db } from "../../../../../lib/db";
import bcrypt from "bcrypt";
import {jwtVerify} from "jose";
import {parse} from "cookie";

export default async function updateAdminDetails(req, res) {
    const { admin_id } = req.query;
    let loggedAdminId;

    //region CURRENT LOGGED ADMIN
    try {
        const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
        if (!cookies || !cookies.token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(cookies.token, secretKey);
        loggedAdminId = payload.admin_id;
    } catch (err) {
        console.log("Error:", err);
    }
    //endregion

    if (req.method === "GET") {
        try {
            const [admins] = await db.query("SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?", [admin_id]);
            if (admins.length === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }
            await db.query(
                "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                [loggedAdminId, `Viewed Co-Admins: ${admins[0].username}`]
            );
            return res.status(200).json({ success: true, admin: admins[0] });
        } catch (error) {
            console.error("Error fetching admin details:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    if (req.method === "PATCH") {
        const { username, password, email, role, status } = req.body;
        let logActions = [];

        try {
            let query = "UPDATE Admin SET";
            let params = [];

            if (username) {
                query += " username = ?";
                params.push(username);
                logActions.push(`Updated username to ${username}`);
            }
            if (email) {
                if (params.length > 0) query += ",";
                query += " email = ?";
                params.push(email);
                logActions.push(`Updated email to ${email}`);
            }
            if (role) {
                if (params.length > 0) query += ",";
                query += " role = ?";
                params.push(role);
                logActions.push(`Updated role to ${role}`);
            }
            if (status) {
                if (params.length > 0) query += ",";
                query += " status = ?";
                params.push(status);
                logActions.push(`Updated status to ${status}`);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                if (params.length > 0) query += ",";
                query += " password = ?";
                params.push(hashedPassword);
                logActions.push(`Updated password (hashed)`);
            }

            query += " WHERE admin_id = ?";
            params.push(admin_id);

            if (params.length === 1) {
                return res.status(400).json({ success: false, message: "No updates provided" });
            }

            const [updateResult] = await db.query(query, params);
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }
            if (logActions.length > 0) {
                await db.query(
                    "INSERT INTO ActivityLog (admin_id, action, timestamp) VALUES (?, ?, NOW())",
                    [loggedAdminId, `Updated Co-admin (ID: ${admin_id}): ${logActions.join(", ")}`]
                );
            }
            return res.status(200).json({ success: true, message: "Co-admin updated successfully" });

        } catch (error) {
            console.error("Error updating co-admin:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    res.status(405).json({ success: false, message: "Method Not Allowed" });
}
