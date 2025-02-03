import { db } from "../../../lib/db";


export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        console.log("Fetching users from database...");
        const [bugReports] = await db.query("SELECT reportID, User_userID,subject,description,createdAt FROM BugReport");
        console.log("Reports fetched:", bugReports);
        return res.status(200).json({ success: true, bugReports });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
