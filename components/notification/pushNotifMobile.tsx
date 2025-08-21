"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PushInit() {
    useEffect(() => {
        async function setupPush() {
            try {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive !== "granted") {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive === "granted") {
                    await PushNotifications.register();
                }

                // Registration success → get FCM token
                PushNotifications.addListener("registration", (token) => {
                    console.log("📲 Push token:", token.value);
                    // TODO: send to your backend
                });

                PushNotifications.addListener("registrationError", (err) => {
                    console.error("Push registration error:", err.error);
                });

                PushNotifications.addListener("pushNotificationReceived", (notification) => {
                    console.log("Push received:", notification);
                });

                PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
                    console.log("Push action performed:", notification.notification);
                });
            } catch (err) {
                console.error("Push setup error", err);
            }
        }

        setupPush();
    }, []);

    return null; // nothing to render
}
