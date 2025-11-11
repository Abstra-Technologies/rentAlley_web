"use client";

import { useEffect } from "react";
import io from "socket.io-client";
import ChatComponent from "@/components/chat/chat";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";

const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

export default function LandlordChatPage() {
    const { user } = useAuthStore();
    const { preselectedChat, clearPreselectedChat } = useChatStore();
    const userId = user?.user_id;

    useEffect(() => {
        clearPreselectedChat();
    }, [clearPreselectedChat]);

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            <TenantOutsidePortalNav />
            {/* Main Chat Section */}
            {preselectedChat ? (
                <ChatComponent userId={userId} preselectedChat={preselectedChat} />
            ) : (
                <ChatComponent userId={userId} />
            )}
        </div>
    );
}