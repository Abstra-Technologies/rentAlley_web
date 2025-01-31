import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { db } from "../../lib/db";
import { decryptEmail, decryptData } from "../../crypto/encrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [users] = await db.query("SELECT * FROM User");

    // Decrypt and compare email to find a match
    const user = users.find((c) => decryptEmail(c.email) === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const decryptionKey = process.env.EMAIL_SECRET_KEY;
    const firstName = decryptData(user.firstName, decryptionKey);
    const lastName = decryptData(user.lastName, decryptionKey);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      userID: user.userID,
      userType: user.userType,
      firstName: firstName,
      lastName: lastName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .setIssuedAt()
      .setSubject(user.userID.toString())
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
    const userID = users[0].userID;
    await db.query(
      "INSERT INTO ActivityLog (userID, action, timestamp) VALUES (?, ?, ?)",
      [userID, action, timestamp]
    );

    // Respond with token and user info
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: email, // Send the plaintext email
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
