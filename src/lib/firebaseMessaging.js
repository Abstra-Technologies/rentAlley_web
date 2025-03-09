import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";


let messaging = null;

if (typeof window !== "undefined") {
    console.log("🔄 Checking browser compatibility...");

    isSupported().then((supported) => {
        if (!supported) {
            console.warn("This browser does not support Firebase Cloud Messaging.");
            return;
        }

        console.log("Browser supports Firebase Cloud Messaging.");

        // ✅ Initialize Firebase
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        };

        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        console.log("✅ Firebase Messaging Initialized:", messaging);

        //Ensure Service Worker is registered only when browser is ready
        window.addEventListener("load", () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register("/firebase-messaging-sw.js")
                    .then((registration) => {
                        console.log("✅ Service Worker Registered:", registration);
                    })
                    .catch((error) => {
                        console.error("❌ Service Worker Registration Failed:", error);
                    });
            } else {
                console.warn("⚠️ Service Workers not supported in this browser.");
            }
        });

        // ✅ Handle Foreground Notifications
        onMessage(messaging, (payload) => {
            console.log("📩 Foreground Notification:", payload);
            alert(`${payload.notification.title}\n${payload.notification.body}`);
        });
    });
}

export const requestNotificationPermission = async () => {
    if (!messaging) {
        console.warn("⚠️ Messaging is not initialized (probably running on the server)");
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        console.log("Notification Permission Granted");
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        console.log("✅ FCM Token:", token);
        return token;
    } else {
        console.warn("❌ Notification Permission Denied");
        return null;
    }
};

export { messaging };

