"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CiBellOn } from "react-icons/ci";

/* =====================================================
   🔹 Custom Hook: useNotifications
   ===================================================== */
const useNotifications = (user, admin) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastFetchRef = useRef(0);

    const fetchNotifications = useCallback(
        async (showLoading = true) => {
            try {
                if (!user && !admin) return;

                const userId = user?.user_id || admin?.admin_id;
                if (!userId) return;

                // Prevent spam-fetching (cooldown)
                const now = Date.now();
                if (now - lastFetchRef.current < 5000) return;
                lastFetchRef.current = now;

                if (showLoading) setLoading(true);
                setError(null);

                const res = await fetch(`/api/notification/getNotifications?userId=${userId}`);
                if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
                const data = await res.json();

                // Sort newest first
                const sorted = data.sort(
                    (a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
                );
                setNotifications(sorted);
                setUnreadCount(sorted.filter((n) => !n.is_read).length);
            } catch (err) {
                console.error("Error fetching notifications:", err);
                setError("Failed to load notifications");
            } finally {
                setLoading(false);
            }
        },
        [user, admin]
    );

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchNotifications();
        intervalRef.current = setInterval(() => fetchNotifications(false), 30000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (id: number) => {
        try {
            const res = await fetch("/api/notification/markSingleRead", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unread = notifications.filter((n) => !n.is_read);
        if (unread.length === 0) return;

        try {
            await fetch("/api/notification/markAllAsRead", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: unread.map((n) => n.id) }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    }, [notifications]);

    const deleteNotification = useCallback(
        async (id: number) => {
            try {
                const res = await fetch(`/api/notification/delete/${id}`, { method: "DELETE" });
                if (res.ok) {
                    setNotifications((prev) => prev.filter((n) => n.id !== id));
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            } catch (err) {
                console.error("Error deleting notification:", err);
            }
        },
        []
    );

    return { notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotification };
};

/* =====================================================
   🔹 Notification Item
   ===================================================== */
const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div
            className={`relative group hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                !notification.is_read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
            }`}
            onClick={() => !notification.is_read && onMarkRead(notification.id)}
        >
            <div className="px-4 py-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                notification.is_read ? "bg-gray-300" : "bg-blue-500"
                            }`}
                        ></div>
                        <p
                            className={`text-sm font-medium truncate ${
                                !notification.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                            }`}
                        >
                            {notification.title}
                        </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 ml-4">{notification.body}</p>
                    <p className="text-xs text-gray-400 mt-1 ml-4">
                        {formatTimeAgo(notification.created_at || notification.timestamp)}
                    </p>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                    }}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
                    title="Delete"
                >
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4H9v3H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

/* =====================================================
   🔹 Desktop Dropdown
   ===================================================== */
const NotificationDropdown = ({
                                  notifications,
                                  unreadCount,
                                  loading,
                                  error,
                                  onMarkAsRead,
                                  onMarkAllAsRead,
                                  onDelete,
                                  onRefresh,
                                  user,
                              }) => {
    const [filter, setFilter] = useState("all");
    const filtered = notifications.filter((n) =>
        filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read
    );

    return (
        <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white text-black rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-gray-100 rounded-full"
                        title="Refresh"
                        disabled={loading}
                    >
                        <svg
                            className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.58M19.42 11A8 8 0 004.58 9m0 0H9m11 11v-5h-.58a8.003 8.003 0 01-15.36-2H15" />
                        </svg>
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            {notifications.length > 0 && (
                <div className="flex border-b text-sm">
                    {["all", "unread", "read"].map((key) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex-1 py-2 transition-colors ${
                                filter === key ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                ) : loading ? (
                    <div className="p-6 text-gray-400 text-center">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <CiBellOn className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                        No {filter} notifications
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onMarkRead={onMarkAsRead}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="border-t p-2 text-center bg-gray-50">
                    <Link
                        href={`/pages/${user?.userType}/inbox`}
                        className="text-blue-600 text-sm hover:text-blue-800"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
};

/* =====================================================
   🔹 Mobile Dropdown + Wrapper Section
   ===================================================== */
const MobileNotificationDropdown = ({
                                        notifications,
                                        unreadCount,
                                        loading,
                                        error,
                                        onMarkAsRead,
                                        onMarkAllAsRead,
                                        onDelete,
                                        onRefresh,
                                        onClose,
                                        user,
                                    }) => (
    <div className="md:hidden fixed top-14 sm:top-16 left-0 right-0 bg-white shadow-lg z-40 max-h-96 border-b flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
            <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                )}
            </div>
            <div className="flex space-x-2">
                <button onClick={onRefresh} className="p-1.5 hover:bg-gray-100 rounded-full">
                    <svg className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.58M19.42 11A8 8 0 004.58 9m0 0H9m11 11v-5h-.58a8.003 8.003 0 01-15.36-2H15" />
                    </svg>
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {error ? (
                <div className="p-4 text-center text-red-600">{error}</div>
            ) : loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                    <CiBellOn className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                    No notifications
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {notifications.map((n) => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={onMarkAsRead}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>

        {notifications.length > 0 && (
            <div className="border-t p-3 text-center">
                <Link
                    href={`/pages/${user?.userType}/inbox`}
                    onClick={onClose}
                    className="text-blue-600 text-sm hover:text-blue-800"
                >
                    View all →
                </Link>
            </div>
        )}
    </div>
);

/* =====================================================
   🔹 Exported Main Component: NotificationSection
   ===================================================== */
const NotificationSection = ({ user, admin }) => {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications(user, admin);

    const [notifOpen, setNotifOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            {/* Desktop */}
            <div className="hidden md:block relative" ref={ref}>
                <button
                    onClick={() => setNotifOpen((p) => !p)}
                    className="relative p-2 hover:bg-white/10 rounded-lg group transition-all border border-transparent hover:border-white/20"
                >
                    <CiBellOn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
                    )}
                </button>
                {notifOpen && (
                    <NotificationDropdown
                        notifications={notifications}
                        unreadCount={unreadCount}
                        loading={loading}
                        error={error}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                        onDelete={deleteNotification}
                        onRefresh={() => fetchNotifications(true)}
                        user={user}
                    />
                )}
            </div>

            {/* Mobile */}
            <div className="md:hidden relative">
                <button
                    onClick={() => setNotifOpen((p) => !p)}
                    className="relative p-2 hover:bg-white/10 rounded-lg border border-transparent hover:border-white/20"
                >
                    <CiBellOn className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
                    )}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {notifOpen && (
                <MobileNotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    loading={loading}
                    error={error}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onDelete={deleteNotification}
                    onRefresh={() => fetchNotifications(true)}
                    onClose={() => setNotifOpen(false)}
                    user={user}
                />
            )}
        </>
    );
};

export default NotificationSection;
