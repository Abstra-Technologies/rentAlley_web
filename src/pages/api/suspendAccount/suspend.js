import { db } from "../../../lib/db";

export default async function SuspendAccount(req, res) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ error: "Method Not Allowed. Use POST." });
    }
    try {
        const { userId } = req.body;
        if (!userId) {
            return res
                .status(400)
                .json({ error: "Missing required field: userId." });
        }
        const [result] = await db.query(
            "UPDATE User SET is_active = ? WHERE user_id = ?",
            [0, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        return res.status(200).json({
            message: "Account suspended successfully."
        });
    } catch (error) {
        console.error("Error handling suspend account request:", error);
        return res.status(500).json({
            error: "Internal Server Error. Please try again later."
        });
    }
}
