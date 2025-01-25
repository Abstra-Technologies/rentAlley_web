// import jwt from "jsonwebtoken";
//
// export default function handler(req, res) {
//     const token = req.cookies.token; // Retrieve token from cookies
//
//     if (!token) {
//         console.error("Token not found in cookies.");
//         return res.status(401).json({ error: "Unauthorized" });
//     }
//
//     try {
//         const user = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
//         res.status(200).json(user); // Send user details
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error) {
//         res.status(401).json({ error: "Invalid session" });
//     }
// } t

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
