import nodeCrypto from "crypto";
import {db} from "../../../lib/db";


// export default async function handler(req, res) {
//     const { email, otp } = req.body;
//     const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");
//
//     const [user] = await db.query("SELECT user_id FROM User WHERE emailHashed = ?", [emailHash]);
//     if (!user.length) return res.status(400).json({ message: "User not found." });
//
//     const [otpRow] = await db.query("SELECT * FROM UserToken WHERE user_id = ? AND token = ?", [user[0].user_id, otp]);
//     if (!otpRow.length) return res.status(400).json({ message: "Invalid OTP." });
//
//     res.status(200).json({ resetToken: otpRow[0].token });
// }


export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required." });
        }

        const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");

        const [user] = await db.query(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );
        if (!user.length) {
            return res.status(404).json({ error: "User not found." });
        }

        const userId = user[0].user_id;

        // Validate OTP
        const [otpRow] = await db.query(
            `SELECT token, expires_at, used_at 
             FROM UserToken 
             WHERE user_id = ? AND token = ? 
             AND token_type = 'password_reset'`,
            [userId, otp]
        );

        if (!otpRow.length) {
            return res.status(400).json({ error: "Invalid OTP." });
        }

        const otpData = otpRow[0];

        if (new Date(otpData.expires_at) < new Date()) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Prevent OTP reuse
        if (otpData.used_at !== null) {
            return res.status(400).json({ error: "OTP has already been used." });
        }

        // Mark OTP as used
        await db.query(
            "UPDATE UserToken SET used_at = NOW() WHERE user_id = ? AND token = ?",
            [userId, otp]
        );

        // Return reset token
        return res.status(200).json({ resetToken: otpData.token });

    } catch (error) {
        console.error("Error verifying password OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}