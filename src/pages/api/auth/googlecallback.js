import { serialize } from "cookie";
import axios from "axios";
import { SignJWT } from "jose";
import { db } from "../../lib/db";
import crypto from "crypto";

export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        console.error("❌ [Google OAuth] Missing authorization code.");
        return res.status(400).json({ error: "Authorization code is required" });
    }

    try {
        const {
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            REDIRECT_URI_SIGNIN,
            JWT_SECRET,
            NODE_ENV,
        } = process.env;

        console.log("🔍 [Google OAuth] Exchanging authorization code for tokens...");

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

        const emailHash = crypto.createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");
        const [rows] = await db.query("SELECT * FROM User WHERE emailHashed = ?", [emailHash]);

        if (rows.length === 0) {
            console.error("❌ [Google OAuth] User not found.");
            return res.status(400).json({ error: "User does not exist. Please register first." });
        }

        let dbUser;

        if(rows.length > 0){
            dbUser = rows[0];
        }

        const secret = new TextEncoder().encode(JWT_SECRET);

        const token = await new SignJWT({
            user_id: dbUser.user_id,
            email: dbUser.email,
            userType: dbUser.userType,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1h")
            .setIssuedAt()
            .setSubject(dbUser.user_id.toString())
            .sign(secret);

        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${isDev ? "" : "Secure;"} SameSite=Lax`
        );


        if (dbUser.userType === "tenant") {
            return res.redirect(302, "/pages/tenant/dashboard");  // Redirect for normal user
        } else if (dbUser.roles === "landlord") {
            return res.redirect(302, "/pages/tenant/dashboard");  // Redirect for admin
        } else {
            return res.redirect(302, "/");  // Default fallback redirection
        }

    } catch (error) {
        console.error("❌ [Google OAuth] Error during authentication:", error);
        return res.status(500).json({ error: "Failed to authenticate" });
    }
}

