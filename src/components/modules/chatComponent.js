"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import useAuth from "../../../hooks/useSession"; // Import user session

const socket = io("http://localhost:5000"); // Adjust to your backend URL

export default function Chat() {
    const { user } = useAuth(); // Get user session
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on("receive_message", (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            socket.off("receiveMessage");
        };
    }, []);

    const sendMessage = () => {
        if (message.trim() === "") return;

        const chatMessage = {
            user_id: user.user_id,
            firstName: user.firstName,
            message,
        };

        socket.emit("send_message", chatMessage);
        setMessages((prevMessages) => [...prevMessages, chatMessage]);
        setMessage(""); // Clear input after sending
    };

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h2 className="text-2xl font-semibold mb-4">Chat</h2>

            <div className="border p-4 bg-white rounded-lg h-96 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="p-2 border-b">
                        <strong>{msg.firstName}: </strong>
                        <span>{msg.message}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-grow p-2 border rounded-l-lg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 rounded-r-lg"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
