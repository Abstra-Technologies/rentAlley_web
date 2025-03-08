import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function Chats(req, res) {

    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const connection = await db.getConnection();

    try {
        const [chatList] = await connection.query(
            `SELECT DISTINCT
                 m.chat_room,
                 u.firstName AS encryptedFirstName,
                 u.lastName AS encryptedLastName,
                 (SELECT encrypted_message FROM Message WHERE chat_room = m.chat_room ORDER BY timestamp DESC LIMIT 1) AS lastMessage,
                 u.user_id AS chatUserId,
                 t.tenant_id, 
                 l.landlord_id
             FROM Message m
             JOIN User u ON (m.receiver_id = u.user_id OR m.sender_id = u.user_id)
             LEFT JOIN Tenant t ON u.user_id = t.user_id
             LEFT JOIN Landlord l ON u.user_id = l.user_id
             WHERE (m.sender_id = ? OR m.receiver_id = ?)
               AND u.user_id != ? -- do not show the current user messages
             ORDER BY lastMessage DESC`,
            [userId, userId, userId]
        );


        console.log("Chat List Raw Data:", chatList);

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
                lastMessage: chat.lastMessage || "No messages yet",
                chatUserId: chat.chatUserId,
                tenant_id: chat.tenant_id || null,
                landlord_id: chat.landlord_id
            };
        });

        console.log("Decrypted Chat List:", decryptedChatList);

        return res.status(200).json(decryptedChatList);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
