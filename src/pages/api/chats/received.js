import { db } from "../../../lib/db";
import { decryptData } from "../../../crypto/encrypt";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { landlordId } = req.query;
    if (!landlordId) {
        return res.status(400).json({ message: "Landlord ID is required" });
    }

    try {
        const [messages] = await db.query(
            `SELECT 
                m.chat_room,
                m.encrypted_message,
                m.iv,
                m.timestamp,
                u.firstName AS encryptedSenderFirstName,
                u.lastName AS encryptedSenderLastName
             FROM Message m
             JOIN User u ON m.sender_id = u.user_id
             WHERE m.receiver_id = ?
             ORDER BY m.timestamp DESC`,
            [landlordId]
        );

        // Decrypt messages before sending response
        const decryptedMessages = messages.map(msg => {
            let decryptedMessage = "Unknown";
            let decryptedSenderFirstName = "Unknown";
            let decryptedSenderLastName = "Unknown";

            try {
                decryptedMessage = decryptData(JSON.parse(msg.encrypted_message), process.env.ENCRYPTION_SECRET);
                decryptedSenderFirstName = decryptData(JSON.parse(msg.encryptedSenderFirstName), process.env.ENCRYPTION_SECRET);
                decryptedSenderLastName = decryptData(JSON.parse(msg.encryptedSenderLastName), process.env.ENCRYPTION_SECRET);
            } catch (error) {
                console.error("Decryption error:", error);
            }

            return {
                chat_room: msg.chat_room,
                senderName: `${decryptedSenderFirstName} ${decryptedSenderLastName}`,
                message: decryptedMessage,
                timestamp: msg.timestamp,
            };
        });

        return res.status(200).json(decryptedMessages);
    } catch (error) {
        console.error("Error fetching received messages:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
