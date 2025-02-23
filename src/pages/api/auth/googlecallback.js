// import { serialize } from "cookie";
// import axios from "axios";
// import { SignJWT } from "jose";
// import { db } from "../../lib/db";
// import crypto from "crypto";
// import nodemailer from "nodemailer";
//
// export default async function handler(req, res) {
//     const { code } = req.query;
//
//     if (!code) {
//         console.error("[Google OAuth] Missing authorization code.");
//         return res.status(400).json({ error: "Authorization code is required" });
//     }
//
//     try {
//         const {
//             GOOGLE_CLIENT_ID,
//             GOOGLE_CLIENT_SECRET,
//             REDIRECT_URI_SIGNIN,
//             JWT_SECRET,
//             NODE_ENV,
//         } = process.env;
//
//         console.log("[Google OAuth] Exchanging authorization code for tokens...");
//
//         const tokenResponse = await axios.post(
//             "https://oauth2.googleapis.com/token",
//             new URLSearchParams({
//                 code,
//                 client_id: GOOGLE_CLIENT_ID,
//                 client_secret: GOOGLE_CLIENT_SECRET,
//                 redirect_uri: REDIRECT_URI_SIGNIN,
//                 grant_type: "authorization_code",
//             }).toString(),
//             { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//         );
//
//         const { access_token } = tokenResponse.data;
//         console.log("✅ [Google OAuth] Token received.");
//
//         const userInfoResponse = await axios.get(
//             "https://www.googleapis.com/oauth2/v3/userinfo",
//             { headers: { Authorization: `Bearer ${access_token}` } }
//         );
//
//         const user = userInfoResponse.data;
//         console.log("✅ [Google OAuth] User Info:", user);
//
//         const emailHash = crypto.createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");
//         const [rows] = await db.query("SELECT * FROM User WHERE emailHashed = ?", [emailHash]);
//
//         if (rows.length === 0) {
//             console.error("[Google OAuth] User not found.");
//             return res.status(400).json({ error: "User does not exist. Please register first." });
//         }
//
//         let dbUser;
//
//         if(rows.length > 0){
//             dbUser = rows[0];
//         }
//
//         if(dbUser.is_2fa_enabled){
//             const otp = Math.floor(100000 + Math.random() * 900000);
//             const now = new Date();
//             const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
//
//             const nowUTC8 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
//             const expiresAtUTC8 = new Date(expiresAt.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
//
//             await db.query("SET time_zone = '+08:00'");
//
//             await db.query(
//                 "INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at) \n" +
//                 "VALUES (?, '2fa', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))\n" +
//                 "ON DUPLICATE KEY UPDATE \n" +
//                 "  token = VALUES(token), \n" +
//                 "  created_at = NOW(), \n" +
//                 "  expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)",
//                 [dbUser.user_id, otp, nowUTC8, expiresAtUTC8]
//             );
//             await sendOtpEmail(dbUser.email, otp);
//             res.setHeader("Set-Cookie", `pending_2fa=true; Path=/; HttpOnly`);
//             return res.status(200).json({
//                 message: "OTP sent. Please verify to continue.",
//                 requires_otp: true,
//                 user_id:  dbUser.user_id,
//                 userType: dbUser.userType,
//             });
//
//         }
//
//         const secret = new TextEncoder().encode(JWT_SECRET);
//
//         const token = await new SignJWT({
//             user_id: dbUser.user_id,
//             email: dbUser.email,
//             userType: dbUser.userType,
//         })
//             .setProtectedHeader({ alg: "HS256" })
//             .setExpirationTime("2h")
//             .setIssuedAt()
//             .setSubject(dbUser.user_id.toString())
//             .sign(secret);
//
//         const isDev = process.env.NODE_ENV === "development";
//         res.setHeader(
//             "Set-Cookie",
//             `token=${token}; HttpOnly; Path=/; ${isDev ? "" : "Secure;"} SameSite=Lax`
//         );
//
//
//         if (dbUser.userType === "tenant") {
//             return res.redirect(302, "/pages/tenant/dashboard");
//         } else if (dbUser.roles === "landlord") {
//             return res.redirect(302, "/pages/landlord/dashboard");
//         } else {
//             return res.redirect(302, "/");
//         }
//
//     } catch (error) {
//         console.error("[Google OAuth] Error during authentication:", error);
//         return res.status(500).json({ error: "Failed to authenticate" });
//     }
// }
//
//
// async function sendOtpEmail(email, otp) {
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//         },
//         tls: {
//             rejectUnauthorized: false,
//         },
//     });
//
//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "Your Rentahan 2FA OTP Code",
//         text: `Your OTP Code is: ${otp}\nThis code will expire in 10 minutes.`,
//     };
//
//     await transporter.sendMail(mailOptions);
// }
//

import axios from "axios";
import { SignJWT } from "jose";
import { db } from "../../lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
        console.log("✅ [Google OAuth] Token received.");

        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const user = userInfoResponse.data;
        console.log("✅ [Google OAuth] User Info:", user);

        // Hash the email for security
        const emailHash = crypto.createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");

        // Retrieve user from DB
        const [rows] = await db.query("SELECT user_id, email, userType, is_2fa_enabled FROM User WHERE emailHashed = ?", [emailHash]);

        // Debug the query result
        console.log("✅ [Google OAuth] Retrieved DB User:", rows);

        if (rows.length === 0 || !rows[0].email) {
            console.error("❌ [Google OAuth] User not found or email is missing in DB.");
            return res.status(400).json({ error: "User not registered or email missing. Please register first." });
        }

        const dbUser = rows[0]; // Ensure dbUser is correctly assigned

        // Ensure email exists before sending OTP
        if (!dbUser.email) {
            console.error("❌ [Google OAuth] No email found for user in database.");
            return res.status(500).json({ error: "User email is missing. Please contact support." });
        }

        if (dbUser.is_2fa_enabled) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            await db.query(
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

            return res.status(200).json({
                message: "OTP sent. Please verify to continue.",
                requires_otp: true,
                user_id: dbUser.user_id,
                userType: dbUser.userType,
            });
        }

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

        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; SameSite=Lax`
        );

        console.log("[Google OAuth] Login successful.");

        if (dbUser.userType === "tenant") {
            return res.redirect(302, "/pages/tenant/dashboard");
        } else if (dbUser.userType === "landlord") {
            return res.redirect(302, "/pages/landlord/dashboard");
        } else {
            return res.redirect(302, "/");
        }
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
