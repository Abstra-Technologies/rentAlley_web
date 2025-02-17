import crypto from "crypto";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import {SignJWT} from "jose";
import nodemailer from "nodemailer";
import mysql from 'mysql2/promise';
import { encryptData } from "../../crypto/encrypt";
import {logAuditEvent} from "../../utils/auditLogger";

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

    const { firstName, lastName, email, password, dob, mobileNumber, role } =
        req.body;

    if(
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !dob ||
        !mobileNumber ||
        !role
    ) {
        console.error("Missing fields in request body:", req.body);
        return res.status(400).json({ error: "Missing fields" });
    }
    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");
    const [timeResult] = await db.execute("SELECT NOW()");
    console.log("MySQL Server Time:", timeResult);

    const emailHash = CryptoJS.SHA256(email).toString();
    const birthDate = dob; // Map `dob` to `birthDate`
    const phoneNumber = mobileNumber; // Map `mobileNumber` to `phoneNumber`
    const userType = role;

    try {
        await db.beginTransaction();

        // Check if user already exists
        const [existingUser] = await db.execute("SELECT * FROM User WHERE email = ?", [email]);

        let user_id;

        if (existingUser.length > 0) {

            user_id = existingUser[0].user_id;

            // // If user is not verified, resend OTP
            // if (!existingUser[0].email_verified) {
            //     const otp = generateOTP();
            //     await storeOTP(db, user_id, otp);
            //     await sendOtpEmail(email, otp);
            // }

        } else {
            // Generate user_id (UUID)
            const [userIdResult] = await db.query("SELECT UUID() AS uuid");
            user_id = userIdResult[0].uuid;
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            // Hash the password securely
            const hashedPassword = await bcrypt.hash(password, 10);
            const emailEncrypted = JSON.stringify(encryptData(email, process.env.ENCRYPTION_SECRET));
            const fnameEncrypted = JSON.stringify(encryptData(firstName, process.env.ENCRYPTION_SECRET));
            const lnameEncrypted = JSON.stringify(encryptData(lastName, process.env.ENCRYPTION_SECRET));
            const phoneEncrypted = JSON.stringify(encryptData(phoneNumber, process.env.ENCRYPTION_SECRET));
            // Hash email for uniqueness

            console.log("Generating email confirmation token...");
            console.log("Inserting user into database...");
            // Insert into `User_Tbl`
            const [result] = await db.query(
                `INSERT INTO User (user_id,firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, createdAt, updatedAt, emailVerified)
                VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(),?)`,
                [
                    user_id,
                    fnameEncrypted,
                    lnameEncrypted,
                    emailEncrypted,
                    emailHash,
                    hashedPassword,
                    birthDate,
                    phoneEncrypted,
                    userType,
                    0
                ]
            );

            const [user] = await db.execute(
                `SELECT user_id FROM User WHERE emailHashed = ?`,
                [emailHash]
            );

            if (!user || user.length === 0) {
                new Error("Failed to retrieve userID after User creation");
            }

            const userId = user[0].user_id;

            if (role === 'tenant') {
                await db.execute(
                    `INSERT INTO Tenant (user_id) VALUES (?)`,
                    [userId]
                );
            }else if (role === "landlord") {
                console.log("Inserting into Landlord table...");
                await db.execute(
                    `INSERT INTO Landlord (user_id) VALUES (?)`,
                    [userId]
                );
            }

            await logAuditEvent(user_id, "User Registered", "User", user_id, ipAddress, "Success", `New user registered as ${role}`);
            console.log("Logging registration activity...");
            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp)
         VALUES (?, ?, NOW())`,
                [userId, "User registered"]
            );
            // Generate and send OTP
            const otp = generateOTP();
            await storeOTP(db, userId, otp);
            await sendOtpEmail(email, otp);
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('2h')
            .sign(secret);

        console.log("Generated JWT Token for User ID:", user_id);

        const isDev = process.env.NODE_ENV === "development";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${
                isDev ? "" : "Secure;"
            } SameSite=Strict`
        );

        console.log("Cookie Set: auth_token");

        await db.commit();
        res.status(201).json({ message: 'User registered. Please verify your OTP.' });

    } catch (error) {
        await db.rollback();
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        await db.end();
    }
}

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}


async function storeOTP(connection, user_id, otp) {
    console.log(`Storing OTP for User ID: ${user_id}, OTP: ${otp}`);

    // ✅ Set session time zone (works even without SUPER privilege)
    await connection.execute("SET time_zone = '+08:00'");

    // ✅ Delete previous OTPs before inserting a new one
    await connection.execute(
        `DELETE FROM UserToken WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

    // ✅ Insert OTP with correct timestamps
    await connection.execute(
        `INSERT INTO UserToken (user_id, token_type, token, created_at, expires_at)
        VALUES (?, 'email_verification', ?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
        [user_id, otp]
    );

    console.log(`OTP ${otp} stored for user ${user_id} (expires in 10 min)`);
}


async function sendOtpEmail(toEmail, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: {
            rejectUnauthorized: false,
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Your OTP for Rentfolio',
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    });

    console.log(`OTP sent to ${toEmail}`);
}
