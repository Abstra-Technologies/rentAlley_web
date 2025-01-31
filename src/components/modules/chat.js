// "use client";
//
// import { useState, useEffect } from "react";
// import { io } from "socket.io-client";
//
// export default function ChatComponent({ user }) {
//     const [socket, setSocket] = useState(null);
//     const [message, setMessage] = useState("");
//     const [messages, setMessages] = useState([]);
//
//     useEffect(() => {
//         const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
//         setSocket(newSocket);
//
//         newSocket.on("receiveMessage", (newMessage) => {
//             setMessages((prevMessages) => [...prevMessages, newMessage]);
//         });
//
//         // Load chat history from database
//         const fetchMessages = async () => {
//             const response = await fetch("/api/chat");
//             const data = await response.json();
//             setMessages(data);
//         };
//
//         fetchMessages();
//
//         return () => {
//             newSocket.disconnect();
//         };
//     }, []);
//
//     // const sendMessage = async () => {
//     //     if (message.trim() && socket) {
//     //         const newMessage = { sender: user.firstName, text: message, userID: user.userID };
//     //
//     //         // Emit to Socket.io for real-time updates
//     //         socket.emit("sendMessage", newMessage);
//     //         setMessages((prev) => [...prev, newMessage]);
//     //
//     //         // Save to database
//     //         await fetch("/api/chat", {
//     //             method: "POST",
//     //             headers: { "Content-Type": "application/json" },
//     //             body: JSON.stringify({ userID: user.userID, message }),
//     //         });
//     //
//     //         setMessage("");
//     //     }
//     // };
//
//
//     const sendMessage = () => {
//         if (!user || !user.userID) {
//             console.error("❌ Error: userID is missing. Check authentication.");
//             return;
//         }
//
//         if (message.trim() && socket) {
//             const newMessage = {
//                 userID: user.userID, // ✅ Correctly pass userID
//                 message: message.trim(), // ✅ Use 'message' instead of 'text'
//             };
//
//             console.log("🔍 Sending message:", newMessage); // Debugging log
//
//             socket.emit("sendMessage", newMessage, (response) => {
//                 if (response.status === "success") {
//                     setMessage(""); // Clear input on success
//                 } else {
//                     console.error("❌ Message sending failed:", response.message);
//                 }
//             });
//         }
//     };
//
//
//
//     return (
//         <div className="mt-6 border rounded-lg p-4 w-full max-w-lg">
//             <h2 className="text-lg font-semibold">Chat</h2>
//             <div className="h-40 overflow-y-auto border p-2 bg-gray-100 rounded-md">
//                 {messages.map((msg, index) => (
//                     <p key={index} className="p-1">
//                         <strong>{msg.sender || "User"}:</strong> {msg.message}
//                     </p>
//                 ))}
//             </div>
//             <div className="mt-2 flex">
//                 <input
//                     type="text"
//                     value={message}
//                     onChange={(e) => setMessage(e.target.value)}
//                     placeholder="Type a message..."
//                     className="flex-grow p-2 border rounded-md"
//                 />
//                 <button onClick={sendMessage} className="bg-green-500 text-white px-4 py-2 ml-2 rounded-md">
//                     Send
//                 </button>
//             </div>
//         </div>
//     );
// }

"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function ChatComponent({ user }) {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const newSocket = io("http://localhost:4000");
        setSocket(newSocket);

        // Load chat history
        newSocket.on("chatHistory", (chatHistory) => {
            setMessages(chatHistory);
        });

        // Listen for new messages
        newSocket.on("receiveMessage", (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (!user || !user.userID) {
            console.error("❌ Error: userID is missing. Check authentication.");
            return;
        }

        if (message.trim() && socket) {
            const newMessage = { userID: user.userID, firstName: user.firstName, message };

            console.log("🔍 Sending message:", newMessage);

            socket.emit("sendMessage", newMessage, (response) => {
                if (response.status === "success") {
                    setMessage(""); // Clear input on success
                } else {
                    console.error("❌ Message sending failed:", response.message);
                }
            });
        }
    };

    return (
        <div className="mt-6 border rounded-lg p-4 w-full max-w-lg">
            <h2 className="text-lg font-semibold">Chat</h2>
            <div className="h-40 overflow-y-auto border p-2 bg-gray-100 rounded-md">
                {messages.map((msg, index) => (
                    <p key={index} className="p-1">
                        <strong>{msg.firstName}:</strong> {msg.message}
                    </p>
                ))}
            </div>
            <div className="mt-2 flex">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow p-2 border rounded-md"
                />
                <button onClick={sendMessage} className="bg-green-500 text-white px-4 py-2 ml-2 rounded-md">
                    Send
                </button>
            </div>
        </div>
    );
}
