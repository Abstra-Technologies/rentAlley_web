'use client'
import NotificationToggle from "../../../../components/notification/toggle";
import useAuthStore from "../../../../zustand/authStore";

export default function Home() {
    const { user, admin, fetchSession, loading } = useAuthStore();
    const userId = user?.user_id;
    return (
        <div className="p-5">
            <h1 className="text-xl font-bold">Push Notification Settings</h1>
            <NotificationToggle userId={userId} />
        </div>
    );
}