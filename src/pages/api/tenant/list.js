import {db} from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const [tenants] = await db.query("SELECT * FROM Tenant");
        res.status(200).json({ tenants: tenants });

    } catch (error) {
        console.error("Error fetching tenants:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
