import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "../../lib/db";
import {decryptData } from "../../crypto/encrypt";
import nodeCrypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const emailHash = nodeCrypto.createHash("sha256").update(email).digest("hex");
    const [users] = await db.query("SELECT * FROM User WHERE emailHashed = ?", [emailHash]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const firstName = decryptData(JSON.parse(user.firstName), process.env.ENCRYPTION_SECRET);
    const lastName = decryptData(JSON.parse(user.lastName), process.env.ENCRYPTION_SECRET);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const token = await new SignJWT({
      user_id: user.user_id,
      userType: user.userType,
      firstName: firstName,
      lastName: lastName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .setSubject(user.user_id)
      .sign(secret);

    // Set the token as a cookie
    const isDev = process.env.NODE_ENV === "development";
    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; ${
        isDev ? "" : "Secure;"
      } SameSite=Strict`
    );

    //Activity Log
    const action = "User logged in";
    const timestamp = new Date().toISOString();
    const userID = users[0].user_id;
    await db.query(
      "INSERT INTO ActivityLog (user_id, action, timestamp) VALUES (?, ?, ?)",
      [userID, action, timestamp]
    );

    // Respond with token and user info
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userID: user.user_id,
        firstName,
        lastName,
        email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

