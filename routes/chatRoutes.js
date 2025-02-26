// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express");
const router = express.Router();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pool = require("../src/lib/chat-db");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.local" });

const decryptMessage = (encryptedMessage, iv) => {
    if (!encryptedMessage || !iv) {
        console.error("Decryption Error: Missing encrypted message or IV.");
        return "[Decryption Error]";
    }

    try{
        const key = crypto.createHash("sha256").update(process.env.CHAT_ENCRYPTION_SECRET).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
        let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "[Decryption Error]";
    }
};

router.get("/messages", async (req, res) => {
    const { chatRoom } = req.query;

    if (!chatRoom) {
        return res.status(400).json({ error: "Missing chatRoom parameter" });
    }

    try {
        const [messages] = await pool.query(
            `SELECT m.*, u.firstName 
             FROM Message m
             JOIN User u ON m.sender_id = u.user_id
             WHERE chat_room = ? ORDER BY timestamp ASC`,
            [chatRoom]
        );

        // Decrypt messages before sending them to the client
        const decryptedMessages = messages.map((msg) => ({
            sender_id: msg.sender_id,
            sender_name: msg.firstName,
            receiver_id: msg.receiver_id,
            message: decryptMessage(msg.encrypted_message, msg.iv),
            timestamp: msg.timestamp,
        }));

        res.json(decryptedMessages);
    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId parameter" });
    }

    try {
        const [chats] = await pool.query(
            `SELECT DISTINCT m.chat_room,
                             u.firstName AS name,
                             (SELECT encrypted_message FROM Message WHERE chat_room = m.chat_room ORDER BY timestamp DESC LIMIT 1) AS lastMessage
             FROM Message m
                      JOIN User u ON (m.sender_id = u.user_id OR m.receiver_id = u.user_id)
             WHERE m.sender_id = ? OR m.receiver_id = ?`,
            [userId, userId]
        );

        console.log("✅ Chat List API Response:", chats);
        res.json(chats);
    } catch (error) {
        console.error("❌ Error fetching chats:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
