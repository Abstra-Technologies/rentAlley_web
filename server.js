
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require("express");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("socket.io");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crypto = require("node:crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.local" });
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pool = require("./src/lib/chat-db");
// const chatRoutes = require("./routes/chatRoutes");

const app = express();
// app.use("/api/chats", chatRoutes);

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

//region ENCRYPT AND DECRYPT
const encryptMessage = (message) => {
    if (!message || typeof message !== "string") {
        console.error("❌ Encryption Error: Invalid message.");
        return { encrypted: "", iv: "" }; // Return empty values to prevent errors
    }

    const iv = crypto.randomBytes(16);
    const secretKey = process.env.CHAT_ENCRYPTION_SECRET;

    if (!secretKey) {
        console.error("❌ Missing CHAT_ENCRYPTION_SECRET in .env file");
        return { encrypted: "", iv: "" };
    }

    const key = crypto.createHash("sha256").update(secretKey).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    return { encrypted, iv: iv.toString("hex") };
};
const decryptMessage = (encryptedMessage, iv) => {
    if (!encryptedMessage || !iv) {
        console.error("❌ Decryption Error: Missing encrypted message or IV.");
        return "[Decryption Error]";
    }

    try {
        const key = crypto.createHash("sha256").update(process.env.CHAT_ENCRYPTION_SECRET).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
        let decrypted = decipher.update(encryptedMessage, "hex", "utf-8");
        decrypted += decipher.final("utf-8");
        return decrypted;
    } catch (error) {
        console.error("❌ Decryption Failed:", error.message);
        return "[Decryption Error]";
    }
};
//endregion

io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    socket.on("joinRoom", async ({ chatRoom }) => {
        try {
            if (!chatRoom) {
                console.error(`❌ Invalid chatRoom received. ${chatRoom}`);
                return;
            }

            socket.join(chatRoom);
            console.log(`👥 User joined room: ${chatRoom}`);

            const [messages] = await pool.query(
                `SELECT m.*, u.firstName FROM Message m
                 JOIN User u ON m.sender_id = u.user_id
                 WHERE chat_room = ? ORDER BY timestamp ASC`,
                [chatRoom]
            );

            // Decrypt messages
            const decryptedMessages = messages.map((msg) => ({
                sender_id: msg.sender_id,
                sender_name: msg.firstName,
                receiver_id: msg.receiver_id,
                message: decryptMessage(msg.encrypted_message, msg.iv),
                timestamp: msg.timestamp,
            }));

            io.to(chatRoom).emit("loadMessages", decryptedMessages);
        } catch (error) {
            console.error("❌ Error loading messages:", error.message);
        }
    });

    // socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chatRoom }) => {
    //     try {
    //         console.log(`🔹 Received message data:`, { sender_id, sender_type, receiver_id, receiver_type, message, chatRoom });
    //
    //         let [senderResult] = await pool.query(
    //             `SELECT user_id FROM ${sender_type === 'tenant' ? 'Tenant' : 'Landlord'} WHERE ${sender_type}_id = ?`,
    //             [sender_id]
    //         );
    //
    //         let [receiverResult] = await pool.query(
    //             `SELECT user_id FROM ${receiver_type === 'tenant' ? 'Tenant' : 'Landlord'} WHERE ${receiver_type}_id = ?`,
    //             [receiver_id]
    //         );
    //
    //         if (senderResult.length === 0 ) {
    //             console.error("❌ Error: Sender not found in database.");
    //             return;
    //         }
    //
    //         if(receiverResult.length === 0) {
    //             console.error("❌ Error:  receiver not found in database.");
    //             return;
    //         }
    //
    //
    //         const senderUserId = senderResult[0].user_id;
    //         const receiverUserId = receiverResult[0].user_id;
    //
    //         console.log(`✅ Resolved user IDs - Sender: ${senderUserId}, Receiver: ${receiverUserId}`);
    //
    //         const { encrypted, iv } = encryptMessage(message);
    //
    //         await pool.query(
    //             "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
    //             [senderUserId, receiverUserId, encrypted, iv, chatRoom]
    //         );
    //
    //         console.log(`✅ Message saved to DB: ChatRoom - ${chatRoom}`);
    //
    //         io.to(chatRoom).emit("receiveMessage", {
    //             sender_id: senderUserId,
    //             receiver_id: receiverUserId,
    //             message,
    //             timestamp: new Date(),
    //         });
    //     } catch (error) {
    //         console.error("Error sending message:", error);
    //     }
    // });
    // socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chat_room }) => {
    //     try {
    //         console.log(`🔹 Received message data:`, { sender_id, sender_type, receiver_id, receiver_type, message, chat_room });
    //
    //         // ✅ Validate `chat_room` exists
    //         if (!chat_room) {
    //             console.error("❌ Error: Chat room is undefined!");
    //             return;
    //         }
    //
    //         // ✅ Fetch sender's `user_id`
    //         let senderQuery = sender_type === 'tenant'
    //             ? 'SELECT user_id, tenant_id FROM Tenant WHERE tenant_id = ?'
    //             : 'SELECT user_id, landlord_id FROM Landlord WHERE landlord_id = ?';
    //
    //         let [senderResult] = await pool.query(senderQuery, [sender_id]);
    //
    //         if (senderResult.length === 0) {
    //             console.error("❌ Error: Sender not found in database. Sender ID:", sender_id);
    //             return;
    //         }
    //
    //         const senderUserId = senderResult[0].user_id;
    //
    //         // ✅ Fetch receiver's `tenant_id` or `landlord_id` using `user_id`
    //         let receiverQuery = receiver_type === 'tenant'
    //             ? 'SELECT tenant_id FROM Tenant WHERE user_id = ?'
    //             : 'SELECT landlord_id FROM Landlord WHERE user_id = ?';
    //
    //         let [receiverResult] = await pool.query(receiverQuery, [receiver_id]);
    //
    //         if (receiverResult.length === 0) {
    //             console.error("❌ Error: Receiver not found in database. Receiver user_id:", receiver_id);
    //             return;
    //         }
    //
    //         // ✅ Get correct `receiver_id` (tenant_id or landlord_id)
    //         const correctedReceiverId = receiver_type === "tenant"
    //             ? receiverResult[0].tenant_id
    //             : receiverResult[0].landlord_id;
    //
    //         console.log(`✅ Resolved IDs - Sender: ${sender_id}, Receiver: ${correctedReceiverId}`);
    //
    //         // ✅ Encrypt message before saving
    //         const { encrypted, iv } = encryptMessage(message);
    //
    //         // ✅ Store message in database with correct `receiver_id`
    //         await pool.query(
    //             "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
    //             [sender_id, correctedReceiverId, encrypted, iv, chat_room]
    //         );
    //
    //         console.log(`✅ Message saved to DB: ChatRoom - ${chat_room}`);
    //
    //         // ✅ Send message to all users in the chat room
    //         io.to(chat_room).emit("receiveMessage", {
    //             sender_id,
    //             receiver_id: correctedReceiverId, // ✅ Now sending `tenant_id` or `landlord_id`
    //             message,
    //             timestamp: new Date(),
    //         });
    //     } catch (error) {
    //         console.error("❌ Error sending message:", error);
    //     }
    // });

    socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chat_room }) => {
        try {
            console.log(`🔹 Received message data:`, { sender_id, sender_type, receiver_id, receiver_type, message, chat_room });

            // ✅ Validate `chat_room` exists
            if (!chat_room) {
                console.error("❌ Error: Chat room is undefined!");
                return;
            }

            // ✅ Fetch sender's `user_id` using their `tenant_id` or `landlord_id`
            let senderQuery = sender_type === 'tenant'
                ? 'SELECT user_id FROM Tenant WHERE tenant_id = ?'
                : 'SELECT user_id FROM Landlord WHERE landlord_id = ?';

            let [senderResult] = await pool.query(senderQuery, [sender_id]);

            if (senderResult.length === 0) {
                console.error("❌ Error: Sender not found in database. Sender ID:", sender_id);
                return;
            }

            const senderUserId = senderResult[0].user_id;

            // ✅ Fetch receiver's `user_id` using their `tenant_id` or `landlord_id`
            let receiverQuery = receiver_type === 'tenant'
                ? 'SELECT user_id FROM Tenant WHERE tenant_id = ?'
                : 'SELECT user_id FROM Landlord WHERE landlord_id = ?';

            let [receiverResult] = await pool.query(receiverQuery, [receiver_id]);

            if (receiverResult.length === 0) {
                console.error("❌ Error: Receiver not found in database. Receiver ID (tenant_id or landlord_id):", receiver_id);
                return;
            }

            // ✅ Convert `tenant_id` or `landlord_id` to `user_id`
            const receiverUserId = receiverResult[0].user_id;

            console.log(`✅ Resolved IDs - Sender: ${sender_id} (user_id: ${senderUserId}), Receiver: ${receiver_id} (user_id: ${receiverUserId})`);

            // ✅ Encrypt message before saving
            const { encrypted, iv } = encryptMessage(message);

            // ✅ Store message in database with `user_id`
            await pool.query(
                "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                [senderUserId, receiverUserId, encrypted, iv, chat_room]
            );

            console.log(`✅ Message saved to DB: ChatRoom - ${chat_room}`);

            // ✅ Send message to all users in the chat room
            io.to(chat_room).emit("receiveMessage", {
                sender_id: senderUserId,
                receiver_id: receiverUserId, // ✅ Now sending `user_id`
                message,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    });


    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(4000, () => {
    console.log("Socket.io server running on port 4000");
});
