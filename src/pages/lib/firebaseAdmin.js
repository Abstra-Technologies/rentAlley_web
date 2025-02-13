import admin from "firebase-admin";
import serviceAccount from "../../../rentahan-3c6a9-firebase-adminsdk-fbsvc-0e500e8b6d.json"; // Load your private key

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default admin;
