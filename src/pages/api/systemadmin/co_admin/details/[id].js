import { db } from "../../../../lib/db";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === "GET") {
        try {
            const [admins] = await db.query("SELECT admin_id, username, email, role, status FROM Admin WHERE admin_id = ?", [id]);
            if (admins.length === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }
            return res.status(200).json({ success: true, admin: admins[0] });
        } catch (error) {
            console.error("Error fetching admin details:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    if (req.method === "PATCH") {
        const { username, password, email, role, status } = req.body;
        try {
            let query = "UPDATE Admin SET";
            let params = [];

            if (username) {
                query += " username = ?";
                params.push(username);
            }
            if (email) {
                if (params.length > 0) query += ",";
                query += " email = ?";
                params.push(email);
            }
            if (role) {
                if (params.length > 0) query += ",";
                query += " role = ?";
                params.push(role);
            }
            if (status) {
                if (params.length > 0) query += ",";
                query += " status = ?";
                params.push(status);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                if (params.length > 0) query += ",";
                query += " password = ?";
                params.push(hashedPassword);
            }

            query += " WHERE admin_id = ?";
            params.push(id);

            if (params.length === 1) {
                return res.status(400).json({ success: false, message: "No updates provided" });
            }

            const [updateResult] = await db.query(query, params);
            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Co-admin not found" });
            }

            return res.status(200).json({ success: true, message: "Co-admin updated successfully" });

        } catch (error) {
            console.error("Error updating co-admin:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    res.status(405).json({ success: false, message: "Method Not Allowed" });
}
