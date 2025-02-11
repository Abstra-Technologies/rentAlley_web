// import { Client } from "@pusher/push-notifications-web";
//
// export async function initializePusher() {
//     const beamsClient = new Client({
//         instanceId: 'd7cf3987-39c5-4285-bc37-7c5fe5a375d2',
//     });
//
//     await beamsClient.start();
//     await beamsClient.addDeviceInterest("notifications"); // Subscribe to notifications
// }

import { Client } from "@pusher/push-notifications-web";

export async function initializePusher() {
    if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "denied") {
            console.warn("Notifications are blocked by the user.");
            return; // Exit if notifications are blocked
        }

        try {
            // Request Notification Permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.warn("User denied permission for notifications.");
                return;
            }

            if ("serviceWorker" in navigator) {
                // Register the service worker
                await navigator.serviceWorker.register("/service-worker.js");

                // Initialize Pusher Beams
                const beamsClient = new Client({
                    instanceId: 'd7cf3987-39c5-4285-bc37-7c5fe5a375d2',// Replace with your Pusher Beams Instance ID
                });

                await beamsClient.start();
                await beamsClient.addDeviceInterest("notifications"); // Subscribe to push notifications
            }
        } catch (error) {
            console.error("Error initializing Pusher Beams:", error);
        }
    }
}
