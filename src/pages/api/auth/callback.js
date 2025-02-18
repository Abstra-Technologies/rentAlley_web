import { serialize } from 'cookie';
import { db } from "../../lib/db";
import { encryptData } from "../../crypto/encrypt";
import axios from 'axios';
import crypto from "crypto";
import { SignJWT } from "jose";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
    const { code, state } = req.query;
    const { email, dob, mobileNumber } = req.body || {};

    if (!code || !state) {
        return res.status(400).json({ error: "Code and state are required" });
    }

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI,
            JWT_SECRET,
            ENCRYPTION_SECRET
        } = process.env;

        const { userType } = JSON.parse(decodeURIComponent(state)) || {};
        const finalUserType = userType ? userType.trim().toLowerCase() : "tenant";

        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const user = userInfoResponse.data;
        console.log("Google User Info:", user);

        const googleId = user.sub || null;
        const firstName = user.given_name || "Unknown";
        const lastName = user.family_name || "Unknown";
        const email = user.email ? user.email.trim().toLowerCase() : null;
        const phoneNumber = mobileNumber ? mobileNumber.trim() : null;
        const birthDate = dob ? dob.trim() : null;
        const profilePicture = user.picture ;

        if (!googleId) {
            throw new Error("Google OAuth failed: Missing google_id (sub).");
        }
        console.log("Processed Google OAuth Data:", { googleId, firstName, lastName, email, finalUserType });
        const emailHash = email ? crypto.createHash("sha256").update(email).digest("hex") : null;
        const emailEncrypted = email ? JSON.stringify(await encryptData(email, ENCRYPTION_SECRET)) : null;
        const fnameEncrypted = firstName ? JSON.stringify(await encryptData(firstName, ENCRYPTION_SECRET)) : null;
        const lnameEncrypted = lastName ? JSON.stringify(await encryptData(lastName, ENCRYPTION_SECRET)) : null;
        const phoneEncrypted = phoneNumber ? JSON.stringify(await encryptData(phoneNumber, ENCRYPTION_SECRET)) : null;
        const photoEncrypted = phoneNumber ? JSON.stringify(await encryptData(profilePicture, ENCRYPTION_SECRET)) : null;

        console.log("Inserting User:", {
            firstName: fnameEncrypted,
            lastName: lnameEncrypted,
            email: emailEncrypted,
            emailHashed: emailHash,
            googleId: googleId,
            phoneNumber: phoneEncrypted,
            userType: finalUserType,
        });

        const existingUsers = await db.query("SELECT * FROM User WHERE email = ? OR google_id = ?", [email, googleId]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "An account with this email or Google ID already exists." });
        }

        let dbUser;
        let userId;

        if (existingUsers.length > 0) {
            dbUser = existingUsers[0];
            userId = dbUser.user_id;
        } else {
            // Insert new user
            const [result] = await db.execute(
                `INSERT INTO User (user_id, firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, createdAt, updatedAt, google_id, emailVerified, profilePicture)
                 VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?)`,
                [
                    fnameEncrypted || null,
                    lnameEncrypted || null,
                    emailEncrypted || null,
                    emailHash || null,
                    " ",
                    birthDate || null,
                    phoneEncrypted || null,
                    finalUserType || "tenant",
                    googleId || null,
                    0,
                    photoEncrypted,
                ]
            );

            const [user] = await db.execute(
                `SELECT user_id FROM User WHERE emailHashed = ?`,
                [emailHash]
            );

            if (!user || user.length === 0) {
                throw new Error("Failed to retrieve userID after User creation");
            }

            userId = user[0].user_id;

            if (finalUserType === "tenant") {
                await db.execute(`INSERT INTO Tenant (user_id) VALUES (?)`, [userId]);
            } else if (finalUserType === "landlord") {
                await db.execute(`INSERT INTO Landlord (user_id) VALUES (?)`, [userId]);
            }

            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp)
                 VALUES (?, ?, NOW())`,
                [userId, "User registered"]
            );

            dbUser = {
                user_id: userId,
                username: `${firstName} ${lastName}`,
                email: user.email,
                userType: finalUserType,
            };
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        await db.query(
            `INSERT INTO UserToken (user_id, token_type, token, expires_at)
                 VALUES (?, 'email_verification', ?, NOW() + INTERVAL 10 MINUTE)`,
            [userId, otp]
        );
        await sendOtpEmail(user.email, otp);

        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            user_id: dbUser.user_id,
            username: dbUser.username,
            userType: dbUser.userType,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .setIssuedAt()
            .setSubject(userId.toString())
            .sign(secret);

        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${isDev ? "" : "Secure;"} SameSite=Strict`
        );

        res.redirect(`/pages/auth/verify-email`);

    } catch (error) {
        console.error("Error during Google OAuth:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to authenticate" });
    }
}

async function sendOtpEmail(toEmail, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}. This OTP is valid for 10 minutes.`,
        });
        console.log(`OTP sent to ${toEmail}`);
    } catch (error) {
        console.error("Failed to send OTP email:", error);
    }
}
