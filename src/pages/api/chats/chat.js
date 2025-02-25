import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const [chatList] = await db.query(
            `SELECT
                 c.chat_room,
                 u.firstName AS encryptedFirstName,
                 u.lastName AS encryptedLastName,
                 (SELECT encrypted_message FROM Message WHERE chat_room = c.chat_room ORDER BY timestamp DESC LIMIT 1) AS lastMessage,
                 u.user_id AS chatUserId
             FROM Message c
                      JOIN User u ON (c.receiver_id = u.user_id OR c.sender_id = u.user_id)
             WHERE (c.sender_id = ? OR c.receiver_id = ?)
               AND u.user_id != ?  -- Exclude the current user
             GROUP BY c.chat_room, u.firstName, u.lastName, u.user_id`,
            [userId, userId, userId] // Pass userId three times to filter out self messages
        );

        const decryptedChatList = chatList.map(chat => {
            let decryptedFirstName = "Unknown";
            let decryptedLastName = "Unknown";

            try {
                decryptedFirstName = decryptData(JSON.parse(chat.encryptedFirstName), process.env.ENCRYPTION_SECRET);
                decryptedLastName = decryptData(JSON.parse(chat.encryptedLastName), process.env.ENCRYPTION_SECRET);
            } catch (error) {
                console.error("Decryption error:", error);
            }

            return {
                chat_room: chat.chat_room,
                name: `${decryptedFirstName} ${decryptedLastName}`,
                lastMessage: chat.lastMessage,
                chatUserId: chat.chatUserId,
            };
        });

        return res.status(200).json(decryptedChatList);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
