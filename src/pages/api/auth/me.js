import { jwtVerify } from "jose";

export default async function handler(req, res) {
    const token = req.cookies.token;

    if (!token) {
        console.error("Token not found in cookies.");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Return the decoded user details
        res.status(200).json(payload);
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({ error: "Invalid session" });
    }
}
