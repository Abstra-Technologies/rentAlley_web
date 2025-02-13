// import { initializeApp } from "firebase/app";
// import { getMessaging, onMessage, getToken } from "firebase/messaging";
//
// const firebaseConfig = {

// };
//
// const app = initializeApp(firebaseConfig);
//
// let messaging;
// if (typeof window !== "undefined") {
//     messaging = getMessaging(app);
// }
//
//
// export { messaging, getToken, onMessage };

import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBWAciEFsDOctZIEfoUf5VdtqhL2n0MBi4",
    authDomain: "rentahan-3c6a9.firebaseapp.com",
    projectId: "rentahan-3c6a9",
    storageBucket: "rentahan-3c6a9.firebasestorage.app",
    messagingSenderId: "345270510962",
    appId: "1:345270510962:web:962d86d1b0816d9663e9eb",
    measurementId: "G-1DBYWT2T33"
};

const firebaseApp = initializeApp(firebaseConfig);
let messaging = null;
if (typeof window !== "undefined") {
    messaging = getMessaging(firebaseApp);
}

export const requestFCMPermission = async () => {
    if (!messaging) return;

    try {
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
            console.log("FCM Token:", token);
            return token;
        } else {
            console.log("No FCM token received.");
        }
    } catch (error) {
        console.error("Error getting FCM token:", error);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

export { firebaseApp, messaging };