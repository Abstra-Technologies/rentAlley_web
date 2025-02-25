import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let messaging;

if (typeof window !== "undefined" && "Notification" in window) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    // Register service worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("/firebase-messaging-sw.js")
            .then((registration) => {
                console.log("Service Worker registered successfully:", registration);
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error);
            });
    }
}

export { messaging };