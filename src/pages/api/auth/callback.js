import { serialize } from 'cookie';
import { db } from "../../lib/db";
import qs from 'qs';
import axios from 'axios';
import {
    encryptEmail,
    encryptFName,
    encryptLName,
    encryptPhone,
} from "../../crypto/encrypt";
import crypto from "crypto";
import {SignJWT} from "jose";

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
            NODE_ENV,
        } = process.env;

        // Decode state to get the role
        const { role } = JSON.parse(decodeURIComponent(state)) || { role: "tenant" };

        // Exchange code for tokens
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

        // Fetch user info
        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const user = userInfoResponse.data;
        user.role = role; // Attach the role to the user object

        const firstName = user.given_name || "Unknown";
        const lastName = user.family_name || "Unknown";
        const emailHash = user.email ? crypto.createHash("sha256").update(user.email).digest("hex") : null;
        const birthDate = dob || null;
        const phoneNumber = mobileNumber || null;

        const emailEncrypted = user.email ? encryptEmail(user.email) : null;
        const fnameEncrypted = firstName ? encryptFName(firstName) : null;
        const lnameEncrypted = lastName ? encryptLName(lastName) : null;
        const phoneEncrypted = phoneNumber ? encryptPhone(phoneNumber) : null;

        // Check if the user already exists in the database
        const [rows] = await db.execute("SELECT * FROM User WHERE email = ?", [user.email]);

        let dbUser;
        if (rows.length > 0) {
            dbUser = rows[0];
        } else {
            // Insert new user
            const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
            const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

            const [result] = await db.execute(
                `INSERT INTO User (userID, firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, verificationToken, tokenExpiresAt, createdAt, updatedAt)
         VALUES (uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    fnameEncrypted,
                    lnameEncrypted,
                    emailEncrypted,
                    emailHash,
                    " ", // Empty password for OAuth users
                    birthDate,
                    phoneEncrypted,
                    role,
                    emailConfirmationToken,
                    tokenExpiry,
                ]
            );

            const [user] = await db.execute(
                `SELECT userID FROM User WHERE emailHashed = ?`,
                [emailHash]
            );

            if (!user || user.length === 0) {
                throw new Error("Failed to retrieve userID after User creation");
            }

            const userId = user[0].userID;

            if (role === "tenant") {
                await db.execute(`INSERT INTO tenants (userID) VALUES (?)`, [userId]);
            } else if (role === "landlord") {
                await db.execute(`INSERT INTO landlords (userID) VALUES (?)`, [userId]);
            }

            await db.execute(
                `INSERT INTO ActivityLog (userID, action, timestamp)
         VALUES (?, ?, NOW())`,
                [userId, "User registered"]
            );

            dbUser = {
                userID: userId,
                username: `${firstName} ${lastName}`,
                email: user.email,
                roles: role,
            };
        }

        // Generate a JWT for the session using jose
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            userID: dbUser.userID,
            username: dbUser.username,
            userType: dbUser.roles,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1h")
            .setIssuedAt()
            .setSubject(dbUser.userID.toString())
            .sign(secret);

        // Set JWT as an HTTP-only cookie
        const cookie = serialize("auth_token", token, {
            httpOnly: true,
            secure: NODE_ENV !== "development",
            sameSite: "strict",
            path: "/",
        });

        res.setHeader("Set-Cookie", cookie);

        // Redirect user based on their role
        if (dbUser.roles === "tenant") {
            return res.redirect("/pages/tenant/dashboard");
        } else if (dbUser.roles === "landlord") {
            return res.redirect("/pages/dashboard/landlord");
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Error during Google OAuth:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to authenticate" });
    }
}
