import crypto from "crypto";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import {SignJWT} from "jose";
import nodemailer from "nodemailer";
import mysql from 'mysql2/promise';
import { encryptData } from "../../../crypto/encrypt";
import {logAuditEvent} from "../../../utils/auditLogger";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export default async function RegisterAnAccount(req, res) {
    const { firstName, lastName, email, password, dob, mobileNumber, role  } = req.body;

    if (!firstName || !lastName || !email || !password || !dob || !mobileNumber || !role) {
        console.error("Missing fields in request body:", req.body);
        return res.status(400).json({ error: "All fields are required" });
    }

    const db = await mysql.createConnection(dbConfig);
    await db.execute("SET time_zone = '+08:00'");

    try {
        await db.beginTransaction();

        const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
        const birthDate = dob;
        const phoneNumber = mobileNumber;
        const userType = role.toLowerCase();

        const [existingUser] = await db.execute(
            "SELECT user_id FROM User WHERE emailHashed = ?",
            [emailHash]
        );

        let user_id;

        if (existingUser.length > 0) {
            user_id = existingUser[0].user_id;
            console.error("An existing account is already in use.");
            return res.status(400).json({ error: "An account with this email already exists." });
        } else {
            const [userIdResult] = await db.execute("SELECT UUID() AS uuid");
            user_id = userIdResult[0].uuid;

            const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
            const hashedPassword = await bcrypt.hash(password, 10);

            const emailEncrypted = JSON.stringify(await encryptData(email, process.env.ENCRYPTION_SECRET));
            const fnameEncrypted = JSON.stringify(await encryptData(firstName, process.env.ENCRYPTION_SECRET));
            const lnameEncrypted = JSON.stringify(await encryptData(lastName, process.env.ENCRYPTION_SECRET));
            const phoneEncrypted = JSON.stringify(await encryptData(phoneNumber, process.env.ENCRYPTION_SECRET));
            const birthDateEncrypted = JSON.stringify(await encryptData(birthDate, process.env.ENCRYPTION_SECRET));
const photoEncrypted =JSON.stringify(await encryptData(birthDate, process.env.ENCRYPTION_SECRET));
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"


            console.log("Inserting user into database...");

            await db.execute(
                `INSERT INTO User 
                (user_id, firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, createdAt, updatedAt, emailVerified) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
                [
                    user_id,
                    fnameEncrypted,
                    lnameEncrypted,
                    emailEncrypted,
                    emailHash,
                    hashedPassword,
                    birthDateEncrypted,
                    phoneEncrypted,
                    userType,
                    0,

                ]
            );

            if (role === "tenant") {
                await db.execute(
                    `INSERT INTO Tenant (user_id) VALUES (?)`,
                    [user_id]
                );
            } else if (role === "landlord") {
                console.log("Inserting into Landlord table...");
                await db.execute(
                    `INSERT INTO Landlord (user_id) VALUES (?)`,
                    [user_id]
                );
            }

            await logAuditEvent(user_id, "User Registered", "User", user_id, ipAddress, "Success", `New user registered as ${role}`);
            console.log("Logging registration activity...");
            await db.execute(
                `INSERT INTO ActivityLog (user_id, action, timestamp) 
                VALUES (?, ?, NOW())`,
                [user_id, "User registered"]
            );

            const otp = generateOTP();
            await storeOTP(db, user_id, otp);
            await sendOtpEmail(email, otp);
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("2h")
            .sign(secret);

        console.log("Generated JWT Token for User ID:", user_id);

        const isDev = process.env.NODE_ENV === "production";
        res.setHeader(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; ${isDev ? "" : "Secure;"} SameSite=Strict`
        );

        console.log("Cookie Set: auth_token");

        await db.commit();
        res.status(201).json({ message: "User registered. Please verify your OTP." });

    } catch (error) {
        await db.rollback();
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        await db.end();
    }
}

function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

async function storeOTP(connection, user_id, otp) {
    console.log(`Storing OTP for User ID: ${user_id}, OTP: ${otp}`);

    await connection.execute("SET time_zone = '+08:00'");
    await connection.execute(
        `DELETE FROM UserToken WHERE user_id = ? AND token_type = 'email_verification'`,
        [user_id]
    );

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
