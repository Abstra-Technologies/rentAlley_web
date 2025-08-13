importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDr1D8s5pCeD7PHNv1TsDV5dx_GaNcI_PI",
    authDomain: "hestia-c0294.firebaseapp.com",
    projectId: "hestia-c0294",
    storageBucket: "hestia-c0294.firebasestorage.app",
    messagingSenderId: "81240939214",
    appId: "1:81240939214:web:1c6be5442d07f47f034e9f",
    measurementId: "G-FTP8C7GG2N"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
