import { jwtVerify } from "jose";
import { parse } from "cookie"; // Install using `npm install cookie`

export async function getUserFromToken(req) {
    // Parse cookies from request headers
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies.authToken; // Ensure this matches your actual cookie name

    if (!token) {
        return { success: false, message: "Unauthorized", status: 401 };
    }

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);

        if (!payload || !payload.userId) {
            return { success: false, message: "Invalid Token Data", status: 401 };
        }

        return { success: true, userId: payload.userId };
    } catch (err) {
        return { success: false, message: "Invalid Token", status: 401 };
    }
}
