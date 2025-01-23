import jwt from "jsonwebtoken";

export default function handler(req, res) {
    const token = req.cookies.token; // Retrieve token from cookies

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
        res.status(200).json(user); // Send user details
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(401).json({ error: "Invalid session" });
    }
}
