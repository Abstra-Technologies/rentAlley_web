import { db } from "../../lib/db";
import { getCookie } from "cookies-next";
import { jwtVerify } from "jose";
import { encryptData } from "../../crypto/encrypt";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const token = await getCookie("token", { req, res });
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.user_id;

        if (!userId) {
            return res.status(400).json({ error: "Invalid user session" });
        }

        const { firstName, lastName, phoneNumber } = req.body;

        // Encrypt data before storing
        const fnameEncrypted = firstName ? JSON.stringify(await encryptData(firstName, process.env.ENCRYPTION_SECRET)) : null;
        const lnameEncrypted = lastName ? JSON.stringify(await encryptData(lastName, process.env.ENCRYPTION_SECRET)) : null;
        const phoneEncrypted = phoneNumber ? JSON.stringify(await encryptData(phoneNumber, process.env.ENCRYPTION_SECRET)) : null;

        await db.query(
            `UPDATE User SET firstName = ?, lastName = ?, phoneNumber = ? WHERE user_id = ?`,
            [fnameEncrypted, lnameEncrypted, phoneEncrypted, userId]
        );

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("❌ [Profile Update] Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
}
