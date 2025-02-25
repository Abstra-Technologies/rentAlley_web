import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ✅ Initialize Firebase
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
const messaging = getMessaging(app);

// ✅ Register the Service Worker
navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
        console.log("✅ Service Worker Registered:", registration);
    })
    .catch((error) => {
        console.error("❌ Service Worker Registration Failed:", error);
    });

// ✅ Request Notification Permission
export const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Get from Firebase Cloud Messaging Settings
        });
        console.log("✅ FCM Token:", token);
        return token;
    } else {
        console.warn("❌ Notification Permission Denied");
        return null;
    }
};

// ✅ Handle Foreground Notifications
onMessage(messaging, (payload) => {
    console.log("🔔 Foreground Notification:", payload);
    alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
});
