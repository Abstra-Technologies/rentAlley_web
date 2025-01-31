export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Clear the JWT token by setting an expired cookie
        res.setHeader(
            "Set-Cookie",
            "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
        );
        res.status(200).json({ message: "Successfully signed out." });
    } catch (error) {
        console.error("Error during signout:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}
