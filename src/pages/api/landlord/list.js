import { db } from "../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    try {
        const [landlords] = await db.query("SELECT * FROM Landlord");
         res.status(200).json({ landlords: landlords });

    } catch (error) {
        console.error("Error fetching landlords:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

