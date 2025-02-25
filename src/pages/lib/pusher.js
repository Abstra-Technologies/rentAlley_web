import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { Client } from "@pusher/push-notifications-web";

export const initPusherBeams = async (userId) => {
    try {
        const beamsClient = new Client({
            instanceId: process.env.NEXT_PUBLIC_PUSHER_INSTANCE_ID,
        });

        await beamsClient.start();

        // Register service worker
        await navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.log("Service Worker registered:", registration);
                return beamsClient.setServiceWorkerRegistration(registration);
            });

        await beamsClient.addDeviceInterest(`user-${userId}`);
        console.log(`Subscribed to notifications for user-${userId}`);
    } catch (error) {
        console.error("Pusher Beams init error:", error);
    }
};

export const disablePusherBeams = async () => {
    try {
        const beamsClient = new Client({
            instanceId: process.env.NEXT_PUBLIC_PUSHER_INSTANCE_ID,
        });

        await beamsClient.stop();
        console.log("Unsubscribed from notifications");
    } catch (error) {
        console.error("Pusher Beams disable error:", error);
    }
};
