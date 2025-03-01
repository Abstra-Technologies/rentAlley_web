
import { db } from "../../lib/db";
import {NextApiRequest, NextApiResponse} from "next";

export default async function createBugReport(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed, ONLY creaetion of bug report is allowed." });
    }
    try {
        const { user_id, subject, description } = req.body;

        if (!user_id || !subject || !description) {
            return res.status(400).json({ error: "All fields are required." });
        }

        await db.query(
            `INSERT INTO BugReport (user_id, subject, description) VALUES (?, ?, ?)`,
            [user_id, subject, description]
        );
        return res.status(201).json({ message: "Bug report submitted successfully." });
    } catch (error) {
        console.error("Error submitting bug report:", error);
        return res.status(500).json({ error: "Failed to submit bug report." });
    }
}