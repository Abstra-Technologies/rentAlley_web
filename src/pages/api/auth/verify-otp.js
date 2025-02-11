import mysql from 'mysql2/promise';
import {getCookie} from 'cookies-next';
import {jwtVerify, SignJWT} from 'jose';
import {decryptData } from "../../crypto/encrypt";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Await the getCookie() function
        const token = await getCookie('token', { req, res });

        console.log("Received Token:", token);  // ✅ Debugging step

        if (!token || typeof token !== 'string') {
            console.log("No valid token found.");
            return res.status(401).json({ message: 'Unauthorized: No valid token found.' });
        }


        // Ensure JWT secret is available
        if (!process.env.JWT_SECRET) {
            new Error("JWT_SECRET is missing in environment variables");
        }

        // Verify JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Extract user ID from JWT
        const user_id = payload.user_id;

        if (!user_id) {
            return res.status(400).json({ message: 'Invalid token data' });
        }

        // Get OTP from the request body
        const { otp } = req.body;

        if (!otp || otp.length !== 6) {
            return res.status(400).json({ message: 'OTP must be a 6-digit number' });
        }

        const connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // Verify OTP
        const [otpResult] = await connection.execute(`
            SELECT * FROM UserToken
            WHERE user_id = ? AND token = ?
              AND token_type = 'email_verification'
              AND expires_at > NOW() AND used_at IS NULL
        `, [user_id, otp]);

        console.log("OTP Query Result:", otpResult);  // ✅ Debugging step
        if (otpResult.length === 0) {
            console.log("OTP not found or expired:", { user_id, otp });
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Mark OTP as used
        await connection.execute("UPDATE UserToken SET used_at = NOW() WHERE user_id = ? AND token = ?", [user_id, otp]);

        // Update email_verified status
        await connection.execute("UPDATE User SET emailVerified = 1 WHERE user_id = ?", [user_id]);


        // ✅ Get user details from the database
        const [userResult] = await connection.execute(
            "SELECT firstName, lastName, userType FROM User WHERE user_id = ?",
            [user_id]
        );

        if (userResult.length === 0) {
            return res.status(400).json({ message: 'User not found.' });
        }

        // ✅ Decrypt firstName & lastName before sending
        const encryptedFirstName = JSON.parse(userResult[0].firstName);
        const encryptedLastName = JSON.parse(userResult[0].lastName);

        const firstName = await decryptData(encryptedFirstName, process.env.ENCRYPTION_SECRET);
        const lastName = await decryptData(encryptedLastName, process.env.ENCRYPTION_SECRET);

        const userType = userResult[0].userType;
        console.log("Decrypted User Data:", { firstName, lastName, userType }); // ✅ Debugging step

        // ✅ Issue a new JWT token with user_id, userType, firstName, and lastName
        const newToken = await new SignJWT({ user_id, userType, firstName, lastName })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1h')  // Token expires in 1 hour
            .sign(secret);

        // ✅ Store the new token in an HTTP-only cookie
        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${newToken}; HttpOnly; Path=/; ${
                isDev ? "" : "Secure;"
            } SameSite=Strict`
        );

        await connection.commit();
        res.status(200).json({
            message: "OTP verified successfully!",
            userType,
            firstName,
            lastName// ✅ Send userType to frontend
        });

    } catch (error) {
        console.error('JWT Verification Error:', error);
        res.status(401).json({ message: 'Invalid or expired session' });
    }
}