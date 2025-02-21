

// const express = require("express");
// const { createServer } = require("http");
// const { Server } = require("socket.io");
// const mysql = require("mysql2/promise");
// const CryptoJS = require("crypto-js");
// const cors = require("cors");
// const dotenv = require("dotenv");
//
// dotenv.config();
//
// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"],
//     },
// });
//
// app.use(cors());
// app.use(express.json());
//
// let db;
//
// async function initializeDB() {
//     try {
//         db = await mysql.createPool({
//             host: process.env.DB_HOST,
//             user: process.env.DB_USER,
//             password: process.env.DB_PASSWORD,
//             database: process.env.DB_NAME,
//         });
//         console.log("✅ Database connected successfully!");
//     } catch (error) {
//         console.error("❌ Database connection failed:", error);
//         process.exit(1); // Exit if DB connection fails
//     }
// }
//
// // Call the DB Initialization function
// initializeDB();
//
//
// const encryptionKey = process.env.CHAT_ENCRYPTION_SECRET;
//
// const encryptMessage  = (message) => {
//     const iv = CryptoJS.lib.WordArray.random(16);
//     const encrypted = CryptoJS.AES.encrypt(message, encryptionKey, {iv});
//     return{
//         encryptedMessage: encrypted.toString(),
//         iv: iv.toString(),
//     };
// };
//
// const decryptMessage = (encryptedMessage, iv) => {
//     const decrypted = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey, { iv: CryptoJS.enc.Hex.parse(iv) });
//     return decrypted.toString(CryptoJS.enc.Utf8);
// }
//
// io.on("connection", (socket) => {
//
//     socket.on("joinRoom", (room) => {
//         socket.join(room);
//     });
//
//     socket.on("sendMessage", async ({ sender_id, receiver_id, message}) => {
//         if(!sender_id ||  !receiver_id ||  !message)  return;
//
//         const chatRoom = [sender_id, receiver_id].sort().join("_"); // Unique chat ID
//         const { encryptedMessage, iv } = encryptMessage(message);
//
//         await db.execute(
//             `INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)`,
//             [sender_id, receiver_id, encryptedMessage, iv, chatRoom]
//         );
//
//         io.to(chatRoom).emit("receiveMessage", {
//             sender_id,
//             receiver_id,
//             encryptedMessage,
//             iv,
//             chatRoom,
//         });
//     });
//     socket.on("disconnect", () => {
//         console.log("Client disconnected:", socket.id);
//     });
// });
//
// // For chat history.
//
// app.get("/api/chat/:chatRoom", async (req, res) => {
//     const { chatRoom } = req.params;
//
//     try{
//
//         const [messages] = await db.execute(
//             "SELECT sender_id, receiver_id, encrypted_message, iv FROM Message WHERE chat_room = ? ORDER BY timestamp ASC",
//             [chatRoom]
//         );
//
//         const decryptedMessage = messages.map((msg) =>({
//             sender_id: msg.sender_id,
//             receiver_id: msg.receiver_id,
//             message: decryptMessage(msg.encryptedMessage, msg.iv),
//         }));
//         res.status(200).json(decryptedMessage);
//
//     }catch (err){
//         console.error("Error fetching chat:", err);
//     }
// });
//
// server.listen(4000, () => {
//     console.log("Chat server running on port 4000...");
// });


const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const crypto = require("node:crypto");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env.local" });
const pool = require("./src/pages/lib/chat-db");


const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// AES Encryption Function
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




// AES Decryption Function
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

// Handle socket connection
io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    // Join Room and Load Chat History
    socket.on("joinRoom", async ({ chatRoom }) => {
        try {
            if (!chatRoom) {
                console.error("❌ Invalid chatRoom received.");
                return;
            }

            socket.join(chatRoom);
            console.log(`👥 User joined room: ${chatRoom}`);

            // Fetch messages
            const [messages] = await pool.query(
                `SELECT m.*, u.firstName FROM Message m
                                                  JOIN User u ON m.sender_id = u.user_id
                 WHERE chat_room = ? ORDER BY timestamp ASC`,
                [chatRoom]
            );

            // Decrypt messages
            const decryptedMessages = messages.map((msg) => ({
                sender_id: msg.sender_id,
                sender_name: msg.firstName, // Fix case for first name
                receiver_id: msg.receiver_id,
                message: decryptMessage(msg.encrypted_message, msg.iv),
                timestamp: msg.timestamp,
            }));

            io.to(chatRoom).emit("loadMessages", decryptedMessages);
        } catch (error) {
            console.error("❌ Error loading messages:", error.message);
        }
    });

    // Send Message
    socket.on("sendMessage", async ({ sender_id, sender_type, receiver_id, receiver_type, message, chatRoom }) => {
        try {
            console.log(`🔹 Received message data:`, { sender_id, sender_type, receiver_id, receiver_type, message, chatRoom });

            let [senderResult] = await pool.query(
                `SELECT user_id FROM ${sender_type === 'tenant' ? 'Tenant' : 'Landlord'} WHERE ${sender_type}_id = ?`,
                [sender_id]
            );

            let [receiverResult] = await pool.query(
                `SELECT user_id FROM ${receiver_type === 'tenant' ? 'Tenant' : 'Landlord'} WHERE ${receiver_type}_id = ?`,
                [receiver_id]
            );

            if (senderResult.length === 0 || receiverResult.length === 0) {
                console.error("❌ Error: Sender or receiver not found in database.");
                return;
            }

            const senderUserId = senderResult[0].user_id;
            const receiverUserId = receiverResult[0].user_id;

            console.log(`✅ Resolved user IDs - Sender: ${senderUserId}, Receiver: ${receiverUserId}`);

            // Encrypt the message
            const { encrypted, iv } = encryptMessage(message);

            // Insert into database using user_id instead of tenant_id/landlord_id
            await pool.query(
                "INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)",
                [senderUserId, receiverUserId, encrypted, iv, chatRoom]
            );

            console.log(`✅ Message saved to DB: ChatRoom - ${chatRoom}`);

            // Emit the decrypted message back to the client
            io.to(chatRoom).emit("receiveMessage", {
                sender_id: senderUserId,
                receiver_id: receiverUserId,
                message,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("❌ Error sending message:", error);
        }
    });






    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(4000, () => {
    console.log("🚀 Socket.io server running on port 4000");
});
