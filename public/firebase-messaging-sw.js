importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyBWAciEFsDOctZIEfoUf5VdtqhL2n0MBi4",
    authDomain: "rentahan-3c6a9.firebaseapp.com",
    projectId: "rentahan-3c6a9",
    storageBucket: "rentahan-3c6a9.firebasestorage.app",
    messagingSenderId: "345270510962",
    appId: "1:345270510962:web:962d86d1b0816d9663e9eb",
    measurementId: "G-1DBYWT2T33"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon.png",
    });
});
