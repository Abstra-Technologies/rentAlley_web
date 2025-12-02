"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";
import {
  Search,
  Send,
  ArrowLeft,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  X,
} from "lucide-react";
import data from "@emoji-mart/data";
// @ts-ignore
import Picker from "@emoji-mart/react";

const socket: Socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
  { autoConnect: true }
);

interface Chat {
  chat_room: string;
  name: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  landlord_id?: string;
  tenant_id?: string;
}

interface Message {
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  message: string;
  chat_room: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

interface ChatComponentProps {
  userId: string;
  preselectedChat?: Chat;
}

export default function ChatComponent({
  userId,
  preselectedChat,
}: ChatComponentProps) {
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (preselectedChat) {
      setSelectedChat(preselectedChat);
    }
  }, [preselectedChat]);

  // Filter chats based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
    } else {
      const filtered = chatList.filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatList]);

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
          const chats = Array.isArray(data) ? data : [];
          setChatList(chats);
          setFilteredChats(chats);
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

    const handleLoadMessages = (loadedMessages: Message[]) => {
      console.log("Received messages via WebSocket:", loadedMessages);
      setMessages(loadedMessages);
    };

    const handleReceiveMessage = (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    const handleTyping = () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    };

    socket.on("loadMessages", handleLoadMessages);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.emit("leaveRoom", { chatRoom: selectedChat.chat_room });
      socket.off("loadMessages", handleLoadMessages);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
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
      socket.emit("sendMessage", newMessage, (ack: any) => {
        console.log("Message sent successfully:", ack);
      });
    } catch (error) {
      console.error("Error sending message via WebSocket:", error);
    }
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups: { [key: string]: Message[] }, msg) => {
      const date = formatDate(msg.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  return (
    <>
      {/* 
        Height calculations:
        - Mobile: 100vh - 3.5rem (top nav h-14) - 4rem (bottom nav h-16) = calc(100vh - 7.5rem)
        - Desktop: 100vh - 3.5rem (top nav from TenantLayout pt-14) = calc(100vh - 3.5rem)
        
        Note: On desktop with sidebar, the parent already handles pl-72
      */}
      <div
        className="flex w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden
                      h-[calc(100vh-7.5rem)] md:h-[calc(100vh-3.5rem)]"
      >
        {/* Chat List Sidebar */}
        <div
          className={`
            absolute md:relative inset-0 md:inset-auto
            w-full md:w-[320px] lg:w-[380px] xl:w-[420px]
            bg-white/95 backdrop-blur-xl
            border-r border-slate-200/60
            flex flex-col
            z-30 md:z-auto
            transition-transform duration-300 ease-out
            h-full
            ${
              selectedChat
                ? "-translate-x-full md:translate-x-0"
                : "translate-x-0"
            }
          `}
        >
          {/* Sidebar Header */}
          <div className="flex-shrink-0 px-4 lg:px-5 py-4 border-b border-slate-100 bg-white/90">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl lg:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Messages
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                         text-sm placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                         transition-all duration-200"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">
                  Loading conversations...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-slate-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-slate-600 font-medium mb-1">
                  No conversations yet
                </p>
                <p className="text-sm text-slate-400">
                  Start chatting with a landlord or tenant
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {filteredChats.map((chat) => (
                  <li
                    key={chat.chat_room}
                    onClick={() => setSelectedChat(chat)}
                    className={`
                      flex items-center gap-3 px-4 lg:px-5 py-3 cursor-pointer
                      transition-all duration-200
                      ${
                        selectedChat?.chat_room === chat.chat_room
                          ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-l-[3px] border-l-blue-500"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={chat.profilePicture || "/default-avatar.png"}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`font-medium truncate ${
                            selectedChat?.chat_room === chat.chat_room
                              ? "text-blue-600"
                              : "text-slate-800"
                          }`}
                        >
                          {chat.name}
                        </p>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                          {chat.lastMessageTime
                            ? formatTime(chat.lastMessageTime)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 truncate pr-2">
                          {chat.lastMessage || "Start a conversation"}
                        </p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div
          className={`
            flex-1 flex flex-col bg-white/40 backdrop-blur-sm
            h-full
            transition-transform duration-300 ease-out
            ${
              selectedChat
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0"
            }
          `}
        >
          {selectedChat ? (
            <>
              {/* Chat Header - Fixed */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="relative">
                    <img
                      src={selectedChat.profilePicture || "/default-avatar.png"}
                      alt={selectedChat.name}
                      className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800 text-sm lg:text-base">
                      {selectedChat.name}
                    </h2>
                    {isTyping && (
                      <p className="text-xs text-emerald-600">Typing...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 bg-gradient-to-b from-slate-50/50 to-white/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <span className="text-4xl">👋</span>
                    </div>
                    <p className="text-slate-600 font-medium mb-1">
                      Start the conversation
                    </p>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Send a message to {selectedChat.name} to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center mb-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                            {date}
                          </span>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3">
                          {msgs.map((msg, i) => {
                            const isOwn = msg.sender_id === userId;
                            return (
                              <div
                                key={i}
                                className={`flex ${
                                  isOwn ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`
                                    relative max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]
                                    px-4 py-2.5 rounded-2xl
                                    ${
                                      isOwn
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                        : "bg-white text-slate-800 rounded-bl-md shadow-sm border border-slate-100"
                                    }
                                  `}
                                >
                                  <p className="text-sm lg:text-[15px] leading-relaxed break-words">
                                    {msg.message}
                                  </p>
                                  <div
                                    className={`flex items-center justify-end gap-1 mt-1 ${
                                      isOwn ? "text-blue-100" : "text-slate-400"
                                    }`}
                                  >
                                    <span className="text-[10px]">
                                      {formatTime(msg.timestamp)}
                                    </span>
                                    {isOwn &&
                                      (msg.status === "read" ? (
                                        <CheckCheck className="w-3.5 h-3.5" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="flex-shrink-0 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur-xl border-t border-slate-200/60">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute bottom-20 right-4 lg:right-6 z-50 shadow-xl rounded-xl overflow-hidden"
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                      maxFrequentRows={2}
                      perLine={8}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 lg:gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors hidden sm:flex">
                    <Paperclip className="w-5 h-5 text-slate-500" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2.5 lg:py-3 bg-slate-50 border border-slate-200 rounded-full
                               text-sm lg:text-[15px] placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                               transition-all duration-200"
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hidden sm:flex
                        ${
                          showEmojiPicker
                            ? "bg-blue-100 text-blue-600"
                            : "hover:bg-slate-200 text-slate-400"
                        }`}
                    >
                      {showEmojiPicker ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Smile className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`
                      p-3 rounded-full transition-all duration-200 shadow-md
                      ${
                        message.trim()
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State for Desktop */
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
                  <span className="text-5xl">💬</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">
                  Your Messages
                </h2>
                <p className="text-slate-500 max-w-sm">
                  Select a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
