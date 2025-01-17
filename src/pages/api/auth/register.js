import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { db } from "../../lib/db";
import {
  encryptEmail,
  encryptFName,
  encryptLName,
  encryptPhone,
} from "../../crypto/encrypt";
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { firstName, lastName, email, password, dob, mobileNumber, role } =
      req.body;
    console.log("POST request received at /api/auth/register");

    if (
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

    const emailHash = CryptoJS.SHA256(email).toString();
    const birthDate = dob; // Map `dob` to `birthDate`
    const phoneNumber = mobileNumber; // Map `mobileNumber` to `phoneNumber`
    const userType = role;

    try {
      console.log("Checking for existing user...");

      const [existingUser] = await db.query(
        "SELECT email FROM User WHERE email = ?",
        [emailHash]
      );
      if (existingUser.length > 0) {
        return res.status(409).json({
          error: "User with this email already exists, Please Signin instead.",
        });
      }
      console.log("Hashing password...");

      const hashedPassword = await bcrypt.hash(password, 10);
      const emailEncrypted = encryptEmail(email);
      const fnameEncrypted = encryptFName(firstName);
      const lnameEncrypted = encryptLName(lastName);
      const phoneEncrypted = encryptPhone(phoneNumber);
      console.log("Generating email confirmation token...");

      const emailConfirmationToken = crypto.randomBytes(32).toString("hex");
      console.log("Inserting user into database...");
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const [result] = await db.query(
        `INSERT INTO User (userID,firstName, lastName, email, emailHashed, password, birthDate, phoneNumber, userType, verificationToken, tokenExpiresAt, createdAt, updatedAt)
                VALUES (uuid(),?, ?, ?, ?, ?, ?, ?, ?, ?,?, NOW(), NOW())`,
        [
          fnameEncrypted,
          lnameEncrypted,
          emailEncrypted,
          emailHash,
          hashedPassword,
          birthDate,
          phoneEncrypted,
          userType,
          emailConfirmationToken,
          tokenExpiry,
        ]
      );

      const userId = result.insertId;

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
      const confirmationLink = `${process.env.NEXTAUTH_URL}/pages/auth/verify-email?token=${emailConfirmationToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Rentahan: Email Confirmation",
        text: `Please confirm your email by clicking the following link: ${confirmationLink}. This link will expire in 24 hours.`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(201).json({
        message:
          "User registered successfully. Please check your email to confirm your account.",
        userId,
      });
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    console.error("Invalid method:", req.method);
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
