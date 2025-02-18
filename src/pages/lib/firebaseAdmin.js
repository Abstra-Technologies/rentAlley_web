import admin from "firebase-admin";
import serviceAccount from "../../../rentahan-3c6a9-firebase-adminsdk-fbsvc-0e500e8b6d.json";

// // Initialize Firebase Admin SDK
// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//     });
// }
//
// // Function to send push notification
// const sendNotification = async (registrationToken, message) => {
//     try {
//         const response = await admin.messaging().sendToDevice(registrationToken, {
//             notification: {
//                 title: message.title,
//                 body: message.body,
//             },
//         });
//         console.log("Notification sent successfully:", response);
//     } catch (error) {
//         console.error("Error sending notification:", error);
//     }
// };
//
// export { sendNotification };

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default admin;