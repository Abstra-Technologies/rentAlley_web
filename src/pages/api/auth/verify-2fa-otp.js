import { db } from "../../../lib/db";
import { SignJWT } from "jose";

export default async function verify2faOtp(req, res) {
    const { user_id, otp } = req.body;
    if (!user_id || !otp) {
        return res.status(400).json({ error: "User ID and OTP are required" });
    }

    try {
        const [tokens] = await db.query(
            "SELECT * FROM UserToken WHERE user_id = ? AND token_type = '2fa' AND token = ? AND otp_expiry > NOW()",
            [user_id, otp]
        );

        if (tokens.length === 0) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }

        await db.query("DELETE FROM UserToken WHERE user_id = ? AND token_type = '2fa'", [user_id]);

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .sign(secret);

        res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; Secure; SameSite=Strict`);
        return res.status(200).json({
            message: "Login successful",
            token,
            user: { user_id },
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}