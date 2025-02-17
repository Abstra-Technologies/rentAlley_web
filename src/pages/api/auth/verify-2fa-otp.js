import { db } from "../../lib/db";
import { SignJWT } from "jose";

export default async function verify2faOtp(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user_id, otp } = req.body;

    if (!user_id || !otp) {
        return res.status(400).json({ error: "User ID and OTP are required" });
    }

    try {
        const [tokens] = await db.query(
            "SELECT * FROM UserToken WHERE user_id = ? AND token_type = '2fa' AND token = ? AND expires_at > NOW()",
            [user_id, otp]
        );

        if (tokens.length === 0) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }

        // Retrieve user type from the User table
        const [users] = await db.query(
            "SELECT user_id, userType FROM User WHERE user_id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = users[0];

        await db.query(
            "DELETE FROM UserToken WHERE user_id = ? AND token_type = '2fa'",
            [user_id]
        );

        // ✅ Generate new JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ user_id, userType: user.userType })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .sign(secret);

        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; Secure; SameSite=LAX`
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                user_id,
                userType: user.userType,
            },
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
