import mysql from "mysql2/promise";
import { parse } from "cookie";
import { jwtVerify } from "jose";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const cookies = req.headers.cookie ? parse(req.headers.cookie) : null;
    if (!cookies || !cookies.token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    let decoded;
    try {
        const { payload } = await jwtVerify(cookies.token, secretKey);
        decoded = payload;
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid Token" });
    }

    if (!decoded || !decoded.admin_id) {
        return res.status(401).json({ success: false, message: "Invalid Token Data" });
    }

    const currentadmin_id = decoded.admin_id; // Extract logged-in admin's ID
    const { property_id, status, message } = req.body;

    if (!property_id || !status) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // ✅ Retrieve the current status & rejection attempts
        const [rows] = await connection.execute(
            "SELECT status, attempts FROM PropertyVerification WHERE property_id = ?",
            [property_id]
        );

        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: "Property not found" });
        }

        const { status: currentStatus, attempts } = rows[0];

        // ✅ If the property is already rejected twice, prevent further submissions
        if (currentStatus === "Rejected" && attempts >= 2) {
            await connection.end();
            return res.status(403).json({
                message: "This listing has reached the maximum number of rejection attempts. A new application is required."
            });
        }

        // ✅ If the property is being rejected, log the attempt
        let newAttempts = attempts;
        if (status === "Rejected") {
            newAttempts = attempts + 1;
        }

        // ✅ Update the property verification status, rejection message, and admin ID
        const [result] = await connection.execute(
            `UPDATE PropertyVerification 
             SET status = ?, admin_message = ?, reviewed_by = ?, attempts = ?
             WHERE property_id = ?`,
            [status, message || null, currentadmin_id, newAttempts, property_id]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Property not found" });
        }

        return res.status(200).json({
            message: `Property ${status.toLowerCase()} reviewed by Admin ${currentadmin_id}.`,
            attempts: newAttempts
        });

    } catch (error) {
        console.error("Error updating property status:", error);
        return res.status(500).json({ message: "Error updating property status" });
    }
}
