"use client";

import { useState, useEffect } from "react";
import { requestNotificationPermission } from "../../pages/lib/firebaseMessaging";
import axios from "axios";

const NotificationToggle = ({ userId }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        axios.get(`/api/notification/notifications?userId=${userId}`).then((response) => {
            setEnabled(response.data.enabled);
        }).catch(error => {
            console.error("Error fetching notification status:", error);
        });
    }, [userId]);

    const handleToggle = async () => {
        if (!userId) return;

        try {
            if (!enabled) {
                const token = await requestNotificationPermission();
                if (token) {
                    await axios.post("/api/notification/notifications", {
                        userId,
                        token,
                    });
                    setEnabled(true);
                }
            } else {
                await axios.post("/api/notification/notifications", {
                    userId,
                    token: null,
                });
                setEnabled(false);
            }
        } catch (error) {
            console.error("Notification toggle error:", error);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`p-3 rounded-lg text-white ${enabled ? "bg-green-500" : "bg-gray-500"}`}
        >
            {enabled ? "Disable Notifications" : "Enable Notifications"}
        </button>
    );
};

export default NotificationToggle;
