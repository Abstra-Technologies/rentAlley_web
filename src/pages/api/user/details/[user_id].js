import { db } from "../../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { user_id } = req.query;

    try {
        // Fetch user data along with tenant/landlord details (if applicable)
        const [user] = await db.query(
            `SELECT u.user_id, u.firstName, u.lastName, u.userType,
                COALESCE(t.tenant_id, NULL) AS tenant_id,
                COALESCE(l.landlord_id, NULL) AS landlord_id
            FROM User u
            LEFT JOIN Tenant t ON u.user_id = t.user_id
            LEFT JOIN Landlord l ON u.user_id = l.user_id
            WHERE u.user_id = ?`,
            [user_id]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user[0]); // Return user details including tenant/landlord IDs
    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
