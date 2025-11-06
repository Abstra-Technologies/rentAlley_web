import webpush from "web-push";

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys missing in env");
}

webpush.setVapidDetails(
    "mailto:admin@yourdomain.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export { webpush };
