"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import useAuthStore from "../../pages/zustand/authStore";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

export default function ChatComponent() {
    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const { user, admin, fetchSession, loading } = useAuthStore();

    const userId = user?.user_id;

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await axios.get(`/api/chats/chat?userId=${userId}`);
                setChatList(response.data);
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };

        fetchChats();
    }, [userId]);

    useEffect(() => {
        if (!selectedChat) return;

        socket.emit("joinRoom", { chatRoom: selectedChat.chatRoom });

        socket.on("loadMessages", (loadedMessages) => {
            setMessages(loadedMessages);
        });

        socket.on("receiveMessage", (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => {
            socket.off("loadMessages");
            socket.off("receiveMessage");
        };
    }, [selectedChat]);

    const sendMessage = () => {
        if (!message.trim() || !selectedChat) return;

        const newMessage = {
            sender_id: userId,
            receiver_id: selectedChat.receiverId,
            message,
            chatRoom: selectedChat.chatRoom,
        };

        socket.emit("sendMessage", newMessage);
        setMessage("");
    };

    return (
        <div className="min-h-screen flex bg-gray-100 p-4">
            {/* Chat List */}
            <div className="w-1/3 bg-white p-4 rounded-lg shadow overflow-y-auto">
                <h1 className="text-xl font-semibold mb-4">Chats</h1>
                {chatList.length === 0 ? (
                    <p className="text-center text-gray-500">No chats available</p>
                ) : (
                    <ul>
                        {chatList.map((chat) => (
                            <li
                                key={chat.chatRoom}
                                className={`p-2 border-b cursor-pointer ${selectedChat?.chatRoom === chat.chatRoom ? "bg-gray-300" : "hover:bg-gray-200"}`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <p className="font-semibold">{chat.name}</p>
                                <p className="text-sm text-gray-500">Last message: {chat.lastMessage}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Chat Messages */}
            <div className="w-2/3 bg-white p-4 rounded-lg shadow flex flex-col">
                {selectedChat ? (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Chat with {selectedChat.name}</h2>
                        <div className="flex-1 overflow-y-auto p-2 border rounded-lg h-80">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`px-4 py-2 max-w-xs text-white rounded-lg ${
                                            msg.sender_id === userId ? "bg-blue-500" : "bg-gray-700"
                                        }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
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
                    <p className="text-center text-gray-500 flex-1 flex items-center justify-center">Select a chat to start messaging</p>
                )}
            </div>
        </div>
    );
}
