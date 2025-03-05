
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import useAuth from "../../../../../hooks/useSession";

const SearchParamsWrapper = ({ setLandlordId }) => {
    const searchParams = useSearchParams();
    const landlord_id = searchParams.get("landlord_id");

    useEffect(() => {
        setLandlordId(landlord_id);
    }, [landlord_id, setLandlordId]);

    return null;
};

export default function Chat() {
    const { user } = useAuth();
    const router = useRouter();
    const [landlord_id, setLandlordId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [landlordName, setLandlordName] = useState("Landlord");

    const chatRoom = `chat_${[user?.user_id, landlord_id].sort().join("_")}`;

    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/chat/getLandlordName?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.landlordName) {
                    setLandlordName(data.landlordName);
                } else {
                    console.error("No landlord name found");
                }
            })
            .catch((error) => console.error("Fetch error:", error));
    }, [landlord_id]);

    useEffect(() => {
        if (!user || !landlord_id) return;

        const socket = io("http://localhost:4000", { autoConnect: true });

        socket.connect();
        socket.emit("joinRoom", { chatRoom });

        socket.on("loadMessages", (loadedMessages) => {
            setMessages(loadedMessages);
        });

        socket.on("receiveMessage", (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.disconnect();
            socket.off("loadMessages");
            socket.off("receiveMessage");
        };
    }, [user, landlord_id]);

    const sendMessage = () => {
        if (!user || !landlord_id || newMessage.trim() === "") return;

        const socket = io("http://localhost:4000");
        socket.emit("sendMessage", {
            sender_id: user.tenant_id || user.landlord_id,
            sender_type: user.tenant_id ? "tenant" : "landlord",
            receiver_id: landlord_id,
            receiver_type: "landlord",
            message: newMessage,
            chatRoom,
        });

        setNewMessage("");
    };

    return (
        <Suspense fallback={<div>Loading Chat...</div>}>
            <SearchParamsWrapper setLandlordId={setLandlordId} />
            <div className="flex flex-col h-screen">
                <div className="bg-blue-600 text-white p-4 text-center text-lg font-bold">
                    Chat with {landlordName}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`mb-3 ${msg.sender_id === user?.user_id ? "text-right" : "text-left"}`}>
                            <p className="text-sm font-semibold">
                                {msg.sender_id === user?.user_id ? "You" : msg.sender_name}
                            </p>
                            <p className="inline-block p-2 rounded-lg bg-gray-200">
                                {msg.message || "[Encrypted Message]"}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex p-4 border-t">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 border p-2 rounded-md"
                        placeholder="Type your message..."
                    />
                    <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-md ml-2">
                        Send
                    </button>
                </div>
            </div>
        </Suspense>
    );
}
