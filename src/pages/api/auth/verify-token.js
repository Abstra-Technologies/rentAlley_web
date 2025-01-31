import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;  // Store the secret key in your .env file

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const token = req.headers.authorization?.split(" ")[1];  // Extract the token from Authorization header

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            // Verify the JWT token
            const decoded = jwt.verify(token, SECRET_KEY);

            // If verification is successful, return user data from the decoded token
            return res.status(200).json({ user: decoded });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }

    // If method is not GET, return 405 Method Not Allowed
    return res.status(405).json({ error: 'Method Not Allowed' });
}
