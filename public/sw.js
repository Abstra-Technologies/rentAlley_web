// Minimal Web Push service worker (no Workbox, no Firebase)

self.addEventListener("push", (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (_) {}

    // 🔴 1) Notify all active client windows that a new notification arrived
    self.clients.matchAll({ includeUncontrolled: true }).then((clientsArr) => {
        clientsArr.forEach((client) => {
            client.postMessage({ type: "NEW_NOTIFICATION" });
        });
    });

    // 🔴 2) Set native app icon badge (PWA icon badge)
    // Works on: Android, Windows, macOS (Chrome/Edge)
    if (self.registration.setAppBadge) {
        self.registration.setAppBadge(1).catch(() => {});
    } else if (self.registration.setExperimentalAppBadge) {
        self.registration.setExperimentalAppBadge(1);
    }

    // 3) Standard Web Push notification
    const title = data.title || "New Notification";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",
        badge: data.badge || "/icon-72.png",
        data: { url: data.url || "/" },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});


self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification?.data?.url || "/";

    event.waitUntil((async () => {

        // 🔵 4) Clear PWA app icon badge when user interacts
        if (self.registration.clearAppBadge) {
            self.registration.clearAppBadge().catch(() => {});
        } else if (self.registration.setAppBadge) {
            self.registration.setAppBadge(0);
        }

        // Focus an existing tab if it's already open
        const clientsList = await clients.matchAll({
            type: "window",
            includeUncontrolled: true
        });

        for (const client of clientsList) {
            if ("focus" in client && new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
                return client.focus();
            }
        }

        // Or open a new tab
        if (clients.openWindow) return clients.openWindow(url);

    })());
});
