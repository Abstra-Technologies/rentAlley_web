"use client";

import useAuth from "../../../../../hooks/useSession";
import ChatComponent from "../../../../components/modules/chatComponent";


export default function ChatPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    console.log("User Data ", user);

    return (
       <h1>Hello.</h1>
    );
}
