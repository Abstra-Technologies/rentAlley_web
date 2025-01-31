
import { NextRequest, NextResponse } from "next/server";
import { db } from "../lib/db";
import {NextApiRequest, NextApiResponse} from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        const { userID, subject, description } = req.body;

        if (!userID || !subject || !description) {
            return res.status(400).json({ error: "All fields are required." });
        }

        // Insert bug report into the database
        await db.query(
            `INSERT INTO BugReport (User_userID, subject, description) VALUES (?, ?, ?)`,
            [userID, subject, description]
        );

        return res.status(201).json({ message: "Bug report submitted successfully." });
    } catch (error) {
        console.error("Error submitting bug report:", error);
        return res.status(500).json({ error: "Failed to submit bug report." });
    }
}