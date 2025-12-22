import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Optional: Add facebook_id column to User table if not exists
// ALTER TABLE User ADD COLUMN facebook_id VARCHAR(100) UNIQUE;

const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

export async function POST(req: NextRequest) {
    try {
        const { accessToken } = await req.json();

        if (!accessToken) {
            return NextResponse.json({ success: false, message: "Missing access token" }, { status: 400 });
        }

        // Verify token and get user data from Facebook
        const debugResponse = await axios.get(
            `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${APP_ID}|${APP_SECRET}`
        );

        if (!debugResponse.data.data.is_valid) {
            return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
        }

        const userId = debugResponse.data.data.user_id;

        // Get user profile + email
        const meResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${accessToken}`);

        const { id, email, first_name, last_name, name } = meResponse.data;

        // TODO: Connect to your MySQL database here
        // Example using your existing setup (replace with your actual DB logic)

        /*
        const user = await db.query(
            `SELECT * FROM User WHERE facebook_id = ? OR email = ? LIMIT 1`,
            [id, email]
        );

        if (user.length > 0) {
            // Existing user → login (create session, JWT, etc.)
        } else {
            // New user → signup
            await db.query(
                `INSERT INTO User (user_id, firstName, lastName, email, emailHashed, password, google_id, facebook_id, userType, emailVerified, createdAt, updatedAt)
                 VALUES (UUID(), ?, ?, ?, SHA2(LOWER(?), 256), '', '', ?, ?, 1, NOW(), NOW())`,
                [first_name, last_name, email, email, id, 'tenant'] // or 'landlord' based on flow
            );
        }
        */

        // For now, simulate success
        // In real app: create session / JWT and set cookie

        return NextResponse.json({
            success: true,
            user: {
                id,
                name: name || `${first_name} ${last_name}`,
                email,
                picture: meResponse.data.picture?.data?.url,
            },
        });
    } catch (error: any) {
        console.error("Facebook auth error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Authentication failed" },
            { status: 500 }
        );
    }
}