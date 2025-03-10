import axios from "axios";
import crypto from "crypto";
import { SignJWT } from "jose";
import { db } from "../../../lib/db";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    console.error("[Google OAuth] Missing authorization code.");
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    const {
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI_SIGNIN,
      JWT_SECRET,
    } = process.env;

    console.log("[Google OAuth] Exchanging authorization code for tokens...");

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI_SIGNIN,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResponse.data;
    console.log("[Google OAuth] Token received.");

    // Fetch user data from Google
    const userInfoResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const user = userInfoResponse.data;
    console.log("[Google OAuth] User Info:", user);

    // Hash email for security
    const emailHash = crypto
      .createHash("sha256")
      .update(user.email.trim().toLowerCase())
      .digest("hex");

    // Fetch user securely using parameterized query
    const [rows] = await db.execute(
      "SELECT user_id, email, userType, is_2fa_enabled, google_id FROM User WHERE emailHashed = ?",
      [emailHash]
    );

    console.log("[Google OAuth] Retrieved DB User:", rows);

    // Validate user existence and Google ID
    if (rows.length === 0 || !rows[0].email || !rows[0].google_id) {
      console.error(
        "[Google OAuth] User not found, email is missing, or Google ID not linked."
      );
      return res
        .status(400)
        .json({
          error:
            "User not registered or Google ID missing. Please register first.",
        });
    }

    const dbUser = rows[0];

    if (!dbUser.email) {
      console.error("[Google OAuth] No email found for user in database.");
      return res
        .status(500)
        .json({ error: "User email is missing. Please contact support." });
    }

    // If 2FA is enabled, generate OTP and prompt verification
    if (dbUser.is_2fa_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000);

      await db.execute(
        `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
                 VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))
                 ON DUPLICATE KEY UPDATE
                                      token = VALUES(token),
                                      created_at = NOW(),
                                      expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)`,
        [dbUser.user_id, otp]
      );

      console.log("✅ [Google OAuth] Sending OTP to:", dbUser.email);
      await sendOtpEmail(user.email, otp);

      res.setHeader("Set-Cookie", `pending_2fa=true; Path=/; HttpOnly`);

      return res.redirect(`/pages/auth/verify-2fa?user_id=${dbUser.user_id}`);
    }

    // Generate JWT Token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      user_id: dbUser.user_id,
      email: dbUser.email,
      userType: dbUser.userType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .setIssuedAt()
      .setSubject(dbUser.user_id.toString())
      .sign(secret);

    // Set Secure Cookie
    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; SameSite=Lax`
    );

    console.log("[Google OAuth] Login successful.");

    // Redirect user based on role
    const redirectUrl =
      dbUser.userType === "tenant"
        ? "/"
        : dbUser.userType === "landlord"
        ? "/pages/landlord/dashboard"
        : "/";

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("[Google OAuth] Error during authentication:", error);
    return res.status(500).json({ error: "Failed to authenticate" });
  }
}

async function sendOtpEmail(email, otp) {
  if (!email) {
    console.error("[Google OAuth] Attempting to send OTP with no email.");
    throw new Error("Missing email for OTP delivery.");
  }

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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ [Google OAuth] OTP sent to ${email}`);
  } catch (error) {
    console.error("❌ [Google OAuth] Error sending OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }
}
