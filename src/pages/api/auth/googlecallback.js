import { serialize } from 'cookie';
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";
import axios from 'axios';
import {decryptEmail} from "../../crypto/encrypt";

export default async function returningUserCallback(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Authorization code is required." });
    }

    try {
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI_SIGNIN, JWT_SECRET, NODE_ENV } = process.env;

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

        // Fetch user info from Google
        const userInfoResponse = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        const { email } = userInfoResponse.data;

        if (!email) {
            return res.status(400).json({ error: "Failed to retrieve email from Google." });
        }

        console.log("Google User Info:", { email });

        // Check if user exists in the database
        const [rows] = await db.query("SELECT * FROM User WHERE email = ?", [email]);
        // const user = rows.find((c) => decryptEmail(c.email) === email);

        if (!rows) {
            return res.status(404).json({ error: "Account not found. Please register first." });
        }

        const dbUser = rows[0];

        // Generate a JWT for the session
        const token = jwt.sign(
            {
                userId: dbUser.userID,
                username: `${dbUser.firstName} ${dbUser.lastName}`,
                roles: dbUser.userType, // Fetching role from the database
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Set JWT as an HTTP-only cookie
        const cookie = serialize("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
            path: "/",
        });

        res.setHeader("Set-Cookie", cookie);

        // Redirect based on role
        if (dbUser.userType === "tenant") {
            return res.redirect("/pages/tenant/dashboard");
        } else if (dbUser.userType === "landlord") {
            return res.redirect("/dashboard/landlord");
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        console.error("Error during returning user callback:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to authenticate user." });
    }
}
