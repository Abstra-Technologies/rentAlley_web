"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  { autoConnect: true }
);

export default function ChatComponent({ userId, preselectedChat }) {
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedChat) {
      setSelectedChat(preselectedChat);
    }
  }, [preselectedChat]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchChats = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(`/api/chats/getListofChats`, {
          params: { userId },
        });

        if (isMounted) {
          setChatList(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        console.error("Error fetching chats:", err);
        if (isMounted) setError("Failed to load chats. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();

    return () => {
      isMounted = false;
    };
  }, [userId]);


  useEffect(() => {

    if (!selectedChat || !selectedChat.chat_room) {
      return;
    }

    socket.emit("joinRoom", { chatRoom: selectedChat.chat_room });

    const handleLoadMessages = (loadedMessages) => {
      console.log("Received messages via WebSocket:", loadedMessages);
      setMessages(loadedMessages);
    };

    const handleReceiveMessage = (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.on("loadMessages", handleLoadMessages);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.emit("leaveRoom", { chatRoom: selectedChat.chat_room });
      socket.off("loadMessages", handleLoadMessages);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedChat]);

  const sendMessage = () => {
    if (!message.trim() || !selectedChat) {
      console.error("No message or chat selected!");
      return;
    }

    if (!user) {
      console.error("Error: User session not available.");
      return;
    }

    const senderType = user.tenant_id ? "tenant" : "landlord";
    const senderId =
      senderType === "tenant" ? user.tenant_id : user.landlord_id;
    const receiverId =
      senderType === "tenant"
        ? selectedChat.landlord_id
        : selectedChat.tenant_id;
    const receiverType = senderType === "tenant" ? "landlord" : "tenant";

    const newMessage = {
      sender_id: senderId,
      sender_type: senderType,
      receiver_id: receiverId,
      receiver_type: receiverType,
      message,
      chat_room: selectedChat.chat_room,
    };

    try {
      socket.emit("sendMessage", newMessage, (ack) => {
        console.log("Message sent successfully:", ack);
      });
    } catch (error) {
      console.error("Error sending message via WebSocket:", error);
    }
    setMessage("");
  };

  return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] w-full bg-gray-50 overflow-hidden pb-[4.5rem]">
        {/* --- CHAT LIST --- */}
        <div
            className={`w-full lg:w-1/3 bg-white border-r shadow-sm h-full overflow-y-auto transition-transform duration-300
        ${selectedChat ? "translate-x-[-100%] lg:translate-x-0" : "translate-x-0"}`}
        >
          {/* Header */}
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Chats</h1>
          </div>

          {chatList.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No chats available</p>
              </div>
          ) : (
              <ul className="divide-y divide-gray-100">
                {chatList.map((chat) => (
                    <li
                        key={chat.chat_room}
                        onClick={() => setSelectedChat(chat)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                            selectedChat?.chat_room === chat.chat_room
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "hover:bg-gray-50"
                        }`}
                    >
                      <img
                          src={chat.profilePicture || "/default-avatar.png"}
                          alt={chat.name}
                          className="w-10 h-10 rounded-full object-cover border"
                      />

                      <div className="flex-1 min-w-0">
                        <p
                            className={`font-medium truncate ${
                                selectedChat?.chat_room === chat.chat_room
                                    ? "text-blue-600"
                                    : "text-gray-800"
                            }`}
                        >
                          {chat.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </li>
                ))}
              </ul>
          )}
        </div>

        {/* --- CHAT WINDOW --- */}
        <div
            className={`flex-1 bg-white flex flex-col h-full transition-transform duration-300
        ${selectedChat ? "translate-x-0" : "translate-x-[100%] lg:translate-x-0"}`}
        >
          {selectedChat ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-20">
                  <button
                      onClick={() => setSelectedChat(null)}
                      className="lg:hidden p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    ←
                  </button>
                  <img
                      src={selectedChat.profilePicture || "/default-avatar.png"}
                      alt={selectedChat.name}
                      className="w-8 h-8 rounded-full border object-cover"
                  />
                  <h2 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                    {selectedChat.name}
                  </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {messages.length === 0 ? (
                      <p className="text-center text-gray-500 mt-10">
                        No messages yet
                      </p>
                  ) : (
                      messages.map((msg, i) => (
                          <div
                              key={i}
                              className={`flex ${
                                  msg.sender_id === userId ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                                className={`px-4 py-2 rounded-2xl text-sm shadow-sm max-w-[80%] sm:max-w-[70%] ${
                                    msg.sender_id === userId
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                                }`}
                            >
                              {msg.message}
                              <span className="block text-xs mt-1 opacity-70 text-right">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                            </div>
                          </div>
                      ))
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white flex items-center gap-2 sticky bottom-0">
                  <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base"
                  />
                  <button
                      onClick={sendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 active:scale-95 transition"
                  >
                    Send
                  </button>
                </div>
              </>
          ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center text-gray-500 text-center p-6">
                <p>Select a chat to start messaging</p>
              </div>
          )}
        </div>
      </div>
  );

}
