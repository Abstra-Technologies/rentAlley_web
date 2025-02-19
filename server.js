// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const pool = require("./src/pages/lib/chat-db");
// const cors = require("cors");
//
// const app = express();
// const server = http.createServer(app);
//
// // Middleware
// app.use(cors());
// app.use(express.json());
//
// const io = new Server(server, {
//     cors: {
//         origin: "http://localhost:3000", // Update this if client is hosted elsewhere
//         methods: ["GET", "POST"],
//     },
// });
//
// // ✅ Function to fetch chat history
// // const getChatHistory = async () => {
// //     try {
// //         const [messages] = await pool.query(
// //             "SELECT messageID, userID, message, timestamp FROM Message ORDER BY timestamp ASC"
// //         );
// //         return messages;
// //     } catch (error) {
// //         console.error("❌ Error fetching chat history:", error);
// //         return [];
// //     }
// // };
//
// const getChatHistory = async () => {
//     try {
//         const [messages] = await pool.query(`
//       SELECT Message.messageID, Message.userID, User.firstName, Message.message, Message.timestamp
//       FROM Message
//       JOIN User ON Message.userID = User.userID
//       ORDER BY Message.timestamp ASC
//     `);
//         return messages;
//     } catch (error) {
//         console.error("❌ Error fetching chat history:", error);
//         return [];
//     }
// };
//
//
//
// // ✅ Handle socket connections
// io.on("connection", async (socket) => {
//     console.log(`✅ Client connected: ${socket.id}`);
//
//     // 🔹 Send chat history when a client connects
//     const chatHistory = await getChatHistory();
//     socket.emit("chatHistory", chatHistory);
//
//     // 🔹 Handle incoming messages
//     // socket.on("sendMessage", async (data, callback) => {
//     //     try {
//     //         console.log("📩 Received data:", data);
//     //
//     //         // Destructure values
//     //         const { userID, message } = data;
//     //
//     //         // 🔹 Validate inputs
//     //         if (!userID || !message) {
//     //             console.error("❌ Error: Missing userID or message", { userID, message });
//     //             if (callback) return callback({ status: "error", message: "Missing userID or message" });
//     //             return;
//     //         }
//     //
//     //         // 🔹 Save message to database
//     //         const [result] = await pool.query(
//     //             "INSERT INTO Message (userID, message) VALUES (?, ?)",
//     //             [userID, message]
//     //         );
//     //
//     //         console.log(`✅ Message saved with ID: ${result.insertId}`);
//     //
//     //         // 🔹 Broadcast the message to all clients
//     //         const newMessage = {
//     //             messageID: result.insertId,
//     //             userID,
//     //             message,
//     //             timestamp: new Date(),
//     //         };
//     //
//     //         io.emit("receiveMessage", newMessage);
//     //
//     //         // 🔹 Acknowledge the sender
//     //         if (callback) callback({ status: "success", message: "Message sent successfully!" });
//     //
//     //     } catch (error) {
//     //         console.error("❌ Error saving message:", error);
//     //         if (callback) callback({ status: "error", message: "Failed to save message." });
//     //     }
//     // });
//
//     socket.on("sendMessage", async (data, callback) => {
//         try {
//             console.log("📩 Received raw data:", data);
//
//             // Extract correct fields
//             const { userID, message, firstName } = data;
//
//             if (!userID || !message || !firstName) {
//                 console.error("❌ Error: Missing userID, message, or firstName", { userID, message, firstName });
//                 if (callback) return callback({ status: "error", message: "Missing userID, message, or firstName" });
//                 return;
//             }
//
//             const [result] = await pool.query(
//                 "INSERT INTO Message (userID, message) VALUES (?, ?)",
//                 [userID, message]
//             );
//
//             console.log(`✅ Message saved with ID: ${result.insertId}`);
//
//             // 🔹 Broadcast message
//             const newMessage = {
//                 messageID: result.insertId,
//                 userID,
//                 firstName,
//                 message,
//                 timestamp: new Date(),
//             };
//
//             io.emit("receiveMessage", newMessage);
//
//             if (callback) callback({ status: "success", message: "Message sent successfully!" });
//
//         } catch (error) {
//             console.error("❌ Error saving message:", error);
//             if (callback) callback({ status: "error", message: "Failed to save message." });
//         }
//     });
//
//
//
//     // 🔹 Handle user disconnection
//     socket.on("disconnect", () => {
//         console.log(`❌ Client disconnected: ${socket.id}`);
//     });
// });
//
// // ✅ Start the server
// const PORT = 4000;
// server.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const CryptoJS = require("crypto-js");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

let db;

async function initializeDB() {
    try {
        db = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log("✅ Database connected successfully!");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1); // Exit if DB connection fails
    }
}

// Call the DB Initialization function
initializeDB();


const encryptionKey = process.env.CHAT_ENCRYPTION_SECRET;

const encryptMessage  = (message) => {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(message, encryptionKey, {iv});
    return{
        encryptedMessage: encrypted.toString(),
        iv: iv.toString(),
    };
};

const decryptMessage = (encryptedMessage, iv) => {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey, { iv: CryptoJS.enc.Hex.parse(iv) });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

io.on("connection", (socket) => {

    socket.on("joinRoom", (room) => {
        socket.join(room);
    });

    socket.on("sendMessage", async ({ sender_id, receiver_id, message}) => {
        if(!sender_id ||  !receiver_id ||  !message)  return;

        const chatRoom = [sender_id, receiver_id].sort().join("_"); // Unique chat ID
        const { encryptedMessage, iv } = encryptMessage(message);

        await db.execute(
            `INSERT INTO Message (sender_id, receiver_id, encrypted_message, iv, chat_room) VALUES (?, ?, ?, ?, ?)`,
            [sender_id, receiver_id, encryptedMessage, iv, chatRoom]
        );

        io.to(chatRoom).emit("receiveMessage", {
            sender_id,
            receiver_id,
            encryptedMessage,
            iv,
            chatRoom,
        });
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// For chat history.

app.get("/api/chat/:chatRoom", async (req, res) => {
    const { chatRoom } = req.params;

    try{

        const [messages] = await db.execute(
            "SELECT sender_id, receiver_id, encrypted_message, iv FROM Message WHERE chat_room = ? ORDER BY timestamp ASC",
            [chatRoom]
        );

        const decryptedMessage = messages.map((msg) =>({
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            message: decryptMessage(msg.encryptedMessage, msg.iv),
        }));
        res.status(200).json(decryptedMessage);

    }catch (err){
        console.error("Error fetching chat:", err);
    }
});

server.listen(4000, () => {
    console.log("Chat server running on port 4000...");
});