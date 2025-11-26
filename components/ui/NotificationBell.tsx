"use client";

import { useNotificationBadge } from "@/hooks/useNotificationBadge";

export default function NotificationBell() {
    const { hasUnread } = useNotificationBadge();

    return (
        <div className="relative cursor-pointer">
            {/* Your bell icon here */}
            <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white"
            >
                <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z" />
                <path d="M18 16v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>

            {/* 🔴 Red Dot */}
            {hasUnread && (
                <span
                    className="
                        absolute top-0 right-0
                        w-3 h-3
                        bg-red-600
                        rounded-full
                        border border-white
                    "
                />
            )}
        </div>
    );
}
