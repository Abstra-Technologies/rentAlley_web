import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "../../lib/db";
import {decryptData } from "../../crypto/encrypt";
import nodeCrypto from "crypto";
import nodemailer from "nodemailer";

export default async function handler(req, res) {

  const { email, password, fcm_token  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");
    const [users] = await db.query("SELECT * FROM User WHERE emailHashed = ?", [emailHash]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const firstName = decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET);
    const lastName = decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const token = await new SignJWT({
      user_id: user.user_id,
      userType: user.userType,
      firstName: firstName,
      lastName: lastName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .setIssuedAt()
      .setSubject(user.user_id)
      .sign(secret);

    const isDev = process.env.NODE_ENV === "development";
    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; ${
        isDev ? "" : "Secure;"
      } SameSite=Lax`
    );

    if (fcm_token) {
      await db.query("UPDATE User SET fcm_token = ? WHERE user_id = ?", [fcm_token, user.user_id]);
    }


    if(user.is_2fa_enabled){

      const otp = Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

      await db.query("SET time_zone = '+08:00'");

      await db.query(
          "INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at) \n" +
          "VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))\n" +
          "ON DUPLICATE KEY UPDATE \n" +
          "  token = VALUES(token), \n" +
          "  created_at = NOW(), \n" +
          "  expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)",
          [user.user_id, otp, nowUTC8, expiresAtUTC8]
      );

      await sendOtpEmail(email, otp);
      res.setHeader("Set-Cookie", `pending_2fa=true; Path=/; HttpOnly`);
      return res.status(200).json({
        message: "OTP sent. Please verify to continue.",
        requires_otp: true,
        user_id: user.user_id,
        userType: user.userType,
      });
    }

    const action = "User logged in";
    const timestamp = new Date().toISOString();
    const userID = users[0].user_id;
    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, ?)",
      [userID, action, timestamp]
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userID: user.user_id,
        firstName,
        lastName,
        email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error during admin_login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Rentahan 2FA OTP Code",
    text: `Your OTP Code is: ${otp}\nThis code will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}
