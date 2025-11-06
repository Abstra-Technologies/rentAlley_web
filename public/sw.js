// Minimal Web Push service worker (no Workbox, no Firebase)

self.addEventListener("push", (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (_) {}

    const title = data.title || "New Notification";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",   // place icons in /public
        badge: data.badge || "/icon-72.png",
        data: { url: data.url || "/" },
        // tag: "optional-tag", renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification?.data?.url || "/";
    event.waitUntil((async () => {
        const clientsList = await clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clientsList) {
            if ("focus" in client && new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
                return client.focus();
            }
        }
        if (clients.openWindow) return clients.openWindow(url);
    })());
});
