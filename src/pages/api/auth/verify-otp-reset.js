import nodeCrypto from "crypto";
import {db} from "../../lib/db";


export default async function handler(req, res) {
    const { email, otp } = req.body;
    const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");

    const [user] = await db.query("SELECT user_id FROM User WHERE emailHashed = ?", [emailHash]);
    if (!user.length) return res.status(400).json({ message: "User not found." });

    const [otpRow] = await db.query("SELECT * FROM UserToken WHERE user_id = ? AND token = ?", [user[0].user_id, otp]);
    if (!otpRow.length) return res.status(400).json({ message: "Invalid OTP." });

    res.status(200).json({ resetToken: otpRow[0].token });
}
