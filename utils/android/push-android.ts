import { PushNotifications } from '@capacitor/push-notifications';

export async function initAndroidPush(): Promise<string | null> {
    console.log("📱 Initializing Android Push…");

    try {
        // 1️⃣ Check permission
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
            const req = await PushNotifications.requestPermissions();
            if (req.receive !== "granted") {
                console.warn("❌ Push permission not granted");
                return null;
            }
        }

        // 2️⃣ Register with FCM
        await PushNotifications.register();

        // 3️⃣ Listen for token and return it using a Promise
        return await new Promise((resolve) => {
            PushNotifications.addListener("registration", (token) => {
                console.log("🔥 ANDROID FCM TOKEN:", token.value);
                resolve(token.value);
            });

            PushNotifications.addListener("registrationError", (err) => {
                console.error("❌ Registration error:", err);
                resolve(null);
            });
        });

    } catch (err) {
        console.error("❌ initAndroidPush failed:", err);
        return null;
    }
}
