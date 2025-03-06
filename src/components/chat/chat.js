"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import  useAuthStore  from "../../zustand/authStore";

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
                console.error(" Error fetching chats:", error);
            }
        };

        if (userId) fetchChats();
    }, [userId]);

    // useEffect(() => {
    //     if (!selectedChat || !selectedChat.chat_room) {
    //         console.error(" Missing chat_room!", { user, selectedChat });
    //         return;
    //     }
    //
    //     console.log("✅ Joining Room:", selectedChat.chat_room);
    //
    //     const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });
    //
    //     socket.emit("joinRoom", { chatRoom: selectedChat.chat_room });
    //
    //     // Fetch past messages from API when joining a chat
    //     const fetchMessages = async () => {
    //         try {
    //             console.log(`📨 Fetching messages for chat_room: ${selectedChat.chat_room}`);
    //             const response = await axios.get(`/api/chats/messages?chat_room=${selectedChat.chat_room}`);
    //             console.log("✅ Messages Loaded:", response.data);
    //             setMessages(response.data);
    //         } catch (error) {
    //             console.error("❌ Error fetching messages:", error);
    //         }
    //     };
    //     fetchMessages();
    //
    //     const handleLoadMessages = (loadedMessages) => {
    //         console.log("📥 Received loadMessages event:", loadedMessages);
    //         setMessages(loadedMessages);
    //     };
    //
    //     // Listen for new messages via WebSocket
    //     const handleReceiveMessage = (newMessage) => {
    //         console.log("📥 New message received via WebSocket:", newMessage);
    //         setMessages((prevMessages) => [...prevMessages, newMessage]);
    //     };
    //
    //
    //
    //     socket.on("loadMessages", handleLoadMessages);
    //     socket.on("receiveMessage", handleReceiveMessage);
    //
    //     return () => {
    //         console.log("🔄 Cleaning up WebSocket listeners...");
    //         socket.disconnect();
    //         socket.off("loadMessages", handleLoadMessages);
    //         socket.off("receiveMessage", handleReceiveMessage);
    //     };
    // }, [user, selectedChat]);

    useEffect(() => {
        if (!selectedChat || !selectedChat.chat_room) {
            console.error(" Missing chat_room!", { user, selectedChat });
            return;
        }

        if (!user) {
            console.error(" User is undefined!");
            return;
        }

        //  Determine user type (tenant or landlord)
        const userType = user.tenant_id ? "tenant" : "landlord";
        const userId = user.tenant_id || user.landlord_id;

        if (!userId) {
            console.error(" Error: User ID is missing.");
            return;
        }

        console.log("✅ Joining Room:", selectedChat.chat_room);
        console.log("✅ User ID:", userId, "User Type:", userType);

        // ✅ Connect to WebSocket
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

        //  Handle loaded messages from WebSocket
        const handleLoadMessages = (loadedMessages) => {
            console.log("📥 Received loadMessages event:", loadedMessages);
            setMessages(loadedMessages);
        };

        // Handle new messages received via WebSocket
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


    const sendMessage = () => {
        if (!message.trim() || !selectedChat) {
            console.error("❌ No message or chat selected!");
            return;
        }

        console.log(" Debugging `sendMessage` Function:");
        console.log(" Selected Chat Object:", selectedChat);
        console.log(" Chat Room (selectedChat.chat_room):", selectedChat.chat_room);
        console.log(" User Object (from session):", user);

        if (!selectedChat.chat_room) {
            console.error(" Chat room is undefined! Cannot send message.");
            return;
        }

        //  Determine sender type  based on session user
        const senderType = user.tenant_id ? "tenant" : "landlord";
        const senderId = user.tenant_id || user.landlord_id; // ✅ Ensure sender_id comes from session

        // Determine receiver type dynamically (opposite of sender)
        const receiverType = senderType === "tenant" ? "landlord" : "tenant";

        //  Fetch the correct `receiver_id` (tenant_id or landlord_id) from `selectedChat`
        const receiverId = senderType === "tenant"
            ? selectedChat.landlord_id // If sender is tenant, receiver must be the landlord
            : selectedChat.tenant_id;   // If sender is landlord, receiver must be the tenant

        // Prevent sending a message to yourself
        if (receiverId === senderId) {
            console.error(" Error: Sender and receiver cannot be the same.");
            return;
        }

        const newMessage = {
            sender_id: senderId,
            sender_type: senderType,
            receiver_id: receiverId,
            receiver_type: receiverType,
            message,
            chat_room: selectedChat.chat_room,
        };

        console.log("📤 Sending message:", newMessage);
        socket.emit("sendMessage", newMessage);

        setMessage("");
    };



    return (
        <div className="flex flex-col lg:flex-row bg-gray-100 h-screen w-full p-0">
          {/* ✅ Chat List Section */}
          <div className="w-full lg:w-1/3 bg-white p-4 rounded-none lg:rounded-lg shadow-md overflow-y-auto h-full">
            <h1 className="text-xl font-semibold mb-4">Chats</h1>
            {chatList.length === 0 ? (
              <p className="text-center text-gray-500">No chats available</p>
            ) : (
              <ul>
                {chatList.map((chat) => (
                  <li
                    key={chat.chat_room}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex justify-between items-center ${
                      selectedChat?.chat_room === chat.chat_room
                        ? "bg-blue-100 font-semibold"
                        : "hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{chat.name}</p>
                      <p className="text-sm text-gray-500 truncate w-40">{chat.lastMessage || "No messages yet"}</p>
                    </div>
                    <span className="text-xs text-gray-400">🗨️</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
      
          {/* ✅ Chat Messages Section */}
          <div className="flex-1 bg-white p-4 lg:rounded-lg shadow-md flex flex-col h-full w-full">
            {selectedChat ? (
              <>
                <h2 className="text-lg font-semibold mb-3 border-b pb-2">Chat with {selectedChat.name}</h2>
                <div className="flex-1 overflow-y-auto p-2 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500">No messages yet</p>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex items-end space-x-2 ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender_id !== userId && (
                          <img
                            src={msg.profilePicture || "/default-avatar.png"}
                            alt="User profile"
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div
                          className={`px-4 py-2 max-w-xs text-white rounded-lg shadow-md relative text-sm ${
                            msg.sender_id === userId ? "bg-blue-500" : "bg-gray-700"
                          }`}
                        >
                          {msg.message}
                          <span className="block text-xs text-gray-300 mt-1 text-right">{msg.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 flex items-center gap-2 border-t mt-2 bg-white sticky bottom-0 w-full">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={sendMessage}
                    className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Send
                  </button>
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
