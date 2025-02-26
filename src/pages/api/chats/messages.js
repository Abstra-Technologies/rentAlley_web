import { db } from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { chat_room } = req.query;

    if (!chat_room) {
        return res.status(400).json({ message: "chat_room is required" });
    }

    try {
        const [messages] = await db.query(
            `SELECT m.*, u.firstName, u.lastName, u.profilePicture
             FROM Message m
             JOIN User u ON m.sender_id = u.user_id
             WHERE m.chat_room = ?
             ORDER BY timestamp ASC`,
            [chat_room]
        );

        if (messages.length === 0) {
            return res.status(404).json({ error: "No messages found" });
        }
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
