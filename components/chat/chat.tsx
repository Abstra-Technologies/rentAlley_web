"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  MessageCircle,
  MoreVertical,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

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
  variant?: "tenant" | "landlord";
}

export default function ChatComponent({
  userId,
  preselectedChat,
  variant = "tenant",
}: ChatComponentProps) {
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Height: tenant has navbar, landlord doesn't on desktop
  const heightClass =
    variant === "tenant"
      ? "h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)]"
      : "h-[calc(100vh-3.5rem)] lg:h-screen";

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.emoji);
    inputRef.current?.focus();
  };

  // Close emoji picker on outside click
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (preselectedChat) {
      setSelectedChat(preselectedChat);
    }
  }, [preselectedChat]);

  // Search filter
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

  // Fetch chat list
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
      } catch (err) {
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

  // WebSocket
  useEffect(() => {
    if (!selectedChat || !selectedChat.chat_room) return;

    socket.emit("joinRoom", { chatRoom: selectedChat.chat_room });

    const handleLoadMessages = (loadedMessages: Message[]) => {
      setMessages(loadedMessages);
      setTimeout(() => scrollToBottom(false), 100);
    };

    const handleReceiveMessage = (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
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
  }, [selectedChat, scrollToBottom]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || isSending) return;
    if (!user) return;

    setIsSending(true);

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

    socket.emit("sendMessage", newMessage);
    setMessage("");
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Formatters
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return formatDate(timestamp);
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, msg) => {
      const date = formatDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  // Loading
  if (loading) {
    return (
      <div className={`flex w-full bg-gray-50 overflow-hidden ${heightClass}`}>
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="h-8 bg-gray-200 rounded-lg w-32 mb-4 animate-pulse" />
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="flex-1 p-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full bg-gray-50 overflow-hidden ${heightClass}`}>
      {/* ========== CHAT LIST SIDEBAR ========== */}
      <div
        className={`
          ${selectedChat ? "hidden md:flex" : "flex"}
          w-full md:w-80 lg:w-96
          bg-white border-r border-gray-200
          flex-col flex-shrink-0
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 bg-white border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchQuery ? "No results found" : "No conversations yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Messages will appear here"}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.chat_room}
                  onClick={() => setSelectedChat(chat)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                    ${
                      selectedChat?.chat_room === chat.chat_room
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }
                  `}
                >
                  <img
                    src={chat.profilePicture || "/default-avatar.png"}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {chat.lastMessageTime
                          ? formatLastSeen(chat.lastMessageTime)
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate pr-2">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                      {chat.unreadCount! > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                          {chat.unreadCount! > 99 ? "99+" : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== CHAT WINDOW ========== */}
      <div
        className={`
          ${selectedChat ? "flex" : "hidden md:flex"}
          flex-1 flex-col bg-white
        `}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              <img
                src={selectedChat.profilePicture || "/default-avatar.png"}
                alt={selectedChat.name}
                className="w-10 h-10 rounded-full object-cover"
              />

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {selectedChat.name}
                </h2>
                {isTyping ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    Typing...
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Tap for info</p>
                )}
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Start the conversation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Send a message to {selectedChat.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex justify-center my-4">
                        <span className="px-4 py-1.5 bg-white text-gray-500 text-xs font-medium rounded-full shadow-sm border border-gray-100">
                          {date}
                        </span>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
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
                                  max-w-[80%] px-4 py-2.5 rounded-2xl
                                  ${
                                    isOwn
                                      ? "bg-blue-600 text-white rounded-br-md"
                                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                                  }
                                `}
                              >
                                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                  {msg.message}
                                </p>
                                <div
                                  className={`flex items-center justify-end gap-1.5 mt-1 ${
                                    isOwn ? "text-blue-200" : "text-gray-400"
                                  }`}
                                >
                                  <span className="text-[11px]">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                  {isOwn &&
                                    (msg.status === "read" ? (
                                      <CheckCheck className="w-4 h-4" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Input Area - Extra padding on mobile for FAB buttons */}
            <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 pb-24 md:pb-4">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-32 md:bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-[350px] bg-white shadow-2xl rounded-2xl overflow-hidden z-50 border border-gray-200"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    theme="light"
                    emojiStyle="native"
                    lazyLoadEmojis={true}
                    width="100%"
                    height={300}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 hidden sm:flex">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex-1 relative bg-gray-100 rounded-full flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-5 py-3 bg-transparent text-[15px] placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 mr-1 rounded-full transition-colors flex-shrink-0 ${
                      showEmojiPicker
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-200 text-gray-500"
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
                  disabled={!message.trim() || isSending}
                  className={`
                    p-3 rounded-full transition-all flex-shrink-0
                    ${
                      message.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
            <div className="max-w-md text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Your Messages
              </h2>
              <p className="text-gray-500 mb-6">
                Select a conversation to start chatting
              </p>
              <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredChats.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Chats</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {filteredChats.reduce(
                      (acc, chat) => acc + (chat.unreadCount || 0),
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Unread</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
