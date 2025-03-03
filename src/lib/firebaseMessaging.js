import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

let messaging = null;

// ✅ Initialize Firebase only in the browser
if (typeof window !== "undefined") {
    const firebaseConfig = {
        apiKey: "AIzaSyBWAciEFsDOctZIEfoUf5VdtqhL2n0MBi4",
        authDomain: "rentahan-3c6a9.firebaseapp.com",
        projectId: "rentahan-3c6a9",
        storageBucket: "rentahan-3c6a9.firebasestorage.app",
        messagingSenderId: "345270510962",
        appId: "1:345270510962:web:962d86d1b0816d9663e9eb",
        measurementId: "G-1DBYWT2T33"
    };

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
            console.log("✅ Service Worker Registered:", registration);
        })
        .catch((error) => {
            console.error("❌ Service Worker Registration Failed:", error);
        });

    onMessage(messaging, (payload) => {
        console.log("Foreground Notification:", payload);
        alert(`${payload.notification.title}\n${payload.notification.body}`);
    });
}

// Move export OUTSIDE the conditional block
export const requestNotificationPermission = async () => {
    if (!messaging) {
        console.warn("Messaging is not initialized (probably running on the server)");
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
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
