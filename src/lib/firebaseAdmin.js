
import admin from "firebase-admin";
import serviceAccount from "./firebase-adminsdk.json"; // ✅ Direct Import

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const sendFCMNotification = async (fcmToken, title, body) => {
    if (!fcmToken) {
        console.warn("⚠️ No FCM token found. Skipping push notification.");
        return;
    }

    const message = {
        notification: { title, body },
        token: fcmToken,
    };

    try {
        await admin.messaging().send(message);
        console.log("✅ Push notification sent successfully!");
    } catch (error) {
        console.error("❌ Error sending push notification:", error);
    }
};
