"use client";
import { useEffect, useState } from "react";

export function useNotificationBadge() {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!navigator.serviceWorker) return;

        navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "NEW_NOTIFICATION") {
                setHasUnread(true);
            }
        });
    }, []);

    return { hasUnread, clearUnread: () => setHasUnread(false) };
}
