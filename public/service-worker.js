
self.addEventListener("push", function (event) {
    const data = event.data.json();

    self.registration.showNotification(data.notification.title, {
        body: data.notification.body,
        icon: "/icon.png", // Change this to your app icon
    });
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow("/")); // Change this to your desired URL
});
