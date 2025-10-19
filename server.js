// --- Core imports ---
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const crypto = require("node:crypto");
require("dotenv").config({ path: ".env" });
const pool = require("./lib/chat-db");

// --- Web Push Setup ---
const webpush = require("web-push");

webpush.setVapidDetails(
    "mailto:upkyp-notify@abstratech.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// --- Express + Socket Server ---
const app = express();
app.use(express.json());
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "https://rentalley-web.onrender.com",
            "http://localhost:3000",
        ],
        methods: ["GET", "POST"],
    },
});

//region ENCRYPT/DECRYPT FUNCTIONS
const encryptMessage = (message) => {
    if (!message || typeof message !== "string") return { encrypted: "", iv: "" };
    const iv = crypto.randomBytes(16);
    const secretKey = process.env.CHAT_ENCRYPTION_SECRET;
    const key = crypto.createHash("sha256").update(secretKey).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encrypted, iv: iv.toString("hex") };
};

const decryptMessage = (encryptedMessage, iv) => {
    if (!encryptedMessage || !iv) return "[Decryption Error]";
    try {
        const key = crypto
            .createHash("sha256")
            .update(process.env.CHAT_ENCRYPTION_SECRET)
            .digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
        let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.error("Decryption Failed:", error.message);
        return "[Decryption Error]";
    }
};
//endregion

//region PUSH NOTIFICATIONS

/**
 * Send web push to all active subscriptions of a user.
 * @param {string} user_id - UUID from User table.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @param {string} [url] - Optional link.
 */
async function sendPushNotification(user_id, title, body, url = "") {
    try {
        const [subscriptions] = await pool.query(
            "SELECT endpoint, p256dh, auth FROM user_push_subscriptions WHERE user_id = ?",
            [user_id]
        );

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`No active subscriptions for user ${user_id}`);
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: "/icons/icon-192x192.png", // optional app icon
            data: { url },
        });

        await Promise.all(
            subscriptions.map(async (sub) => {
                const pushConfig = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };
                try {
                    await webpush.sendNotification(pushConfig, payload);
                } catch (err) {
                    if (err.statusCode === 410) {
                        console.log("Removing expired subscription");
                        await pool.query(
                            "DELETE FROM user_push_subscriptions WHERE endpoint = ?",
                            [sub.endpoint]
                        );
                    } else {
                        console.error("Push failed:", err.message);
                    }
                }
            })
        );

        console.log(`Web push sent to ${subscriptions.length} devices.`);
    } catch (error) {
        console.error("Error sending push:", error);
    }
}

//endregion

//region SOCKET.IO EVENTS
io.on("connection", (socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    socket.on("joinRoom", async ({ chatRoom }) => {
        try {
            if (!chatRoom) return;
            socket.join(chatRoom);
            console.log(`User joined room: ${chatRoom}`);

            const [messages] = await pool.query(
                `SELECT m.*, u.firstName 
                 FROM Message m 
                 JOIN User u ON m.sender_id = u.user_id 
                 WHERE chat_room = ? ORDER BY timestamp ASC`,
                [chatRoom]
            );

            const decryptedMessages = messages.map((msg) => ({
                sender_id: msg.sender_id,
                sender_name: msg.firstName,
                receiver_id: msg.receiver_id,
                message: decryptMessage(msg.encrypted_message, msg.iv),
                timestamp: msg.timestamp,
            }));

            io.to(chatRoom).emit("loadMessages", decryptedMessages);
        } catch (error) {
            console.error("Error loading messages:", error.message);
        }
    });

    socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chat_room }) => {
        try {
            if (!chat_room || !message) return;

            const senderQuery =
                sender_type === "tenant"
                    ? "SELECT user_id FROM Tenant WHERE tenant_id = ?"
                    : "SELECT user_id FROM Landlord WHERE landlord_id = ?";
            const [senderRes] = await pool.query(senderQuery, [sender_id]);
            if (senderRes.length === 0) return;
            const senderUserId = senderRes[0].user_id;

            const receiverQuery =
                receiver_type === "tenant"
                    ? "SELECT user_id FROM Tenant WHERE tenant_id = ?"
                    : "SELECT user_id FROM Landlord WHERE landlord_id = ?";
            const [receiverRes] = await pool.query(receiverQuery, [receiver_id]);
            if (receiverRes.length === 0) return;
            const receiverUserId = receiverRes[0].user_id;

            const { encrypted, iv } = encryptMessage(message);
            await pool.query(
                "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                [senderUserId, receiverUserId, encrypted, iv, chat_room]
            );

            io.to(chat_room).emit("receiveMessage", {
                sender_id: senderUserId,
                receiver_id: receiverUserId,
                message,
                timestamp: new Date(),
            });

            // 🔔 Web push notification
            await sendPushNotification(
                receiverUserId,
                "New Message",
                message,
                `https://rentalley-web.onrender.com/pages/chat/${chat_room}`
            );

            console.log(`Message + push sent to receiver ${receiverUserId}`);

        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User disconnected: ${socket.id}`);
    });
});
//endregion

const PORT = process.env.CHAT_PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Socket.io server with Web Push running on port ${PORT}`);
});
