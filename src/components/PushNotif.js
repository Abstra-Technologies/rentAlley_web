"use client";

import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "../pages/lib/firebaseConfig";
import { getMessaging, onMessage as onMessageListener } from "firebase/messaging";

export default function PushNotification() {
    const [token, setToken] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/firebase-messaging-sw.js").then((registration) => {
                console.log("Service Worker registered:", registration);
            }).catch(console.error);
        }

        requestPermission();

        const messagingInstance = getMessaging();
        onMessageListener(messagingInstance, (payload) => {
            console.log("Foreground notification received:", payload);
            setNotification(payload.notification);
        });

    }, []);

    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                });
                console.log("FCM Token:", token);
                setToken(token);
            } else {
                console.error("Notification permission denied.");
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
        }
    };

    return (
        <div>
            <h3>Push Notifications</h3>
            {token ? <p>FCM Token: {token}</p> : <button onClick={requestPermission}>Enable Notifications</button>}
            {notification && (
                <div>
                    <p><strong>{notification.title}</strong></p>
                    <p>{notification.body}</p>
                </div>
            )}
        </div>
    );
}
