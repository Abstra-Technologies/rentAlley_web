"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import useAuthStore from "../../../../pages/zustand/authStore";
import ReceivedMessagesLandlord from "../../../../components/chat/landlordChats";


const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");

export default function LandlordChatPage() {
    const { user, admin, fetchSession, loading } = useAuthStore();

    const userId = user?.user_id;
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">

            <p>{user?.user_id}</p>
            <h1 className="text-xl font-semibold mb-4">Chat List</h1>
            <ReceivedMessagesLandlord  userId={userId}/>
        </div>
    );
}
