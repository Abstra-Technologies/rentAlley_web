"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import  useAuthStore  from "../../zustand/authStore";

// Initialize socket connection
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

export default function ChatComponent() {
    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const { user } = useAuthStore();

    const userId = user?.user_id;

    useEffect(() => {
        const fetchChats = async () => {
            try {
                console.log("📨 Fetching chats...");
                const response = await axios.get(`/api/chats/chat?userId=${userId}`);
                console.log("✅ Chat List API Response:", response.data);
                setChatList(response.data);
            } catch (error) {
                console.error("❌ Error fetching chats:", error);
            }
        };

        if (userId) fetchChats();
    }, [userId]);

    useEffect(() => {
        if (!selectedChat || !selectedChat.chat_room) {
            console.error(" Missing chat_room!", { user, selectedChat });
            return;
        }

        console.log("✅ Joining Room:", selectedChat.chat_room);

        // ✅ Connect to WebSocket server
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

        socket.emit("joinRoom", { chatRoom: selectedChat.chat_room });

        // ✅ Fetch past messages from API when joining a chat
        const fetchMessages = async () => {
            try {
                console.log(`📨 Fetching messages for chat_room: ${selectedChat.chat_room}`);
                const response = await axios.get(`/api/chats/messages?chat_room=${selectedChat.chat_room}`);
                console.log("✅ Messages Loaded:", response.data);
                setMessages(response.data);
            } catch (error) {
                console.error("❌ Error fetching messages:", error);
            }
        };
        fetchMessages();

        // ✅ Listen for loaded past messages from WebSocket
        const handleLoadMessages = (loadedMessages) => {
            console.log("📥 Received loadMessages event:", loadedMessages);
            setMessages(loadedMessages);
        };

        // ✅ Listen for new messages via WebSocket
        const handleReceiveMessage = (newMessage) => {
            console.log("📥 New message received via WebSocket:", newMessage);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        socket.on("loadMessages", handleLoadMessages);
        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            console.log("🔄 Cleaning up WebSocket listeners...");
            socket.disconnect();
            socket.off("loadMessages", handleLoadMessages);
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [user, selectedChat]);



    // ✅ Send a new message
    const sendMessage = () => {
        if (!message.trim() || !selectedChat) return;

        const newMessage = {
            sender_id: userId,
            receiver_id: selectedChat.chatUserId,  // ✅ Ensure correct receiver ID
            message,
            chat_room: selectedChat.chat_room,
        };

        console.log("📤 Sending message:", newMessage);
        socket.emit("sendMessage", newMessage);
        setMessage("");
    };

    return (
        <div className="min-h-screen flex bg-gray-100 p-4">
            {/* ✅ Chat List Section */}
            <div className="w-1/3 bg-white p-4 rounded-lg shadow overflow-y-auto">
                <h1 className="text-xl font-semibold mb-4">Chats</h1>
                {chatList.length === 0 ? (
                    <p className="text-center text-gray-500">No chats available</p>
                ) : (
                    <ul>
                        {chatList.map((chat) => (
                            <li
                                key={chat.chat_room}
                                className={`p-2 border-b cursor-pointer ${
                                    selectedChat?.chat_room === chat.chat_room ? "bg-gray-300" : "hover:bg-gray-200"
                                }`}
                                onClick={() => {
                                    console.log("🖱 Chat selected:", chat);
                                    setSelectedChat(chat);
                                }}
                            >
                                <p className="font-semibold">{chat.name}</p>
                                <p className="text-sm text-gray-500">Last message: {chat.lastMessage || "No messages yet"}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ✅ Chat Messages Section */}
            <div className="w-2/3 bg-white p-4 rounded-lg shadow flex flex-col">
                {selectedChat ? (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Chat with {selectedChat.name}</h2>
                        <div className="flex-1 overflow-y-auto p-2 border rounded-lg h-80">
                            {messages.length === 0 ? (
                                <p className="text-center text-gray-500">No messages yet</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`px-4 py-2 max-w-xs text-white  text-xl rounded-lg ${
                                                msg.sender_id === userId ? "bg-blue-500" : "bg-gray-700"
                                            }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-2 flex items-center gap-2 border-t mt-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex-1 p-2 border rounded-lg focus:outline-none"
                                placeholder="Type a message..."
                            />
                            <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send</button>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 flex-1 flex items-center justify-center">
                        Select a chat to start messaging
                    </p>
                )}
            </div>
        </div>
    );
}
