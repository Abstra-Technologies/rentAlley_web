"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

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

        const res = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );
        if (!res.ok)
          throw new Error(`Failed to fetch notifications (${res.status})`);
        const data = await res.json();

        // Sort newest first
        const sorted = data.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp).getTime() -
            new Date(a.created_at || a.timestamp).getTime()
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

  const deleteNotification = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/notification/delete/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
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

  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkRead(notification.id);
    }

    if (notification.url) {
      const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const fullUrl = `${base}${
        notification.url.startsWith("/")
          ? notification.url
          : `/${notification.url}`
      }`;
      window.location.href = fullUrl;
    }
  };

  return (
    <div
      className={`relative group hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
        !notification.is_read
          ? "bg-gradient-to-r from-blue-50 to-emerald-50"
          : ""
      }`}
      onClick={handleClick}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Unread indicator */}
        <div className="pt-1">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              notification.is_read
                ? "bg-gray-300"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 animate-pulse"
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm leading-tight mb-1 ${
              !notification.is_read
                ? "font-semibold text-gray-900"
                : "font-medium text-gray-700"
            }`}
          >
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed mb-1">
            {notification.body}
          </p>
          <p className="text-xs text-gray-400">
            {formatTimeAgo(notification.created_at || notification.timestamp)}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 flex-shrink-0"
          title="Delete notification"
        >
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
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
  buttonRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 384; // w-96 = 24rem = 384px

      // Position dropdown to the right of the button
      setPosition({
        top: buttonRect.bottom + 8, // 8px gap (mt-2)
        left: buttonRect.left,
      });
    }
  }, [buttonRef]);

  const [filter, setFilter] = useState("all");
  const filtered = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read
  );

  return (
    <div
      ref={dropdownRef}
      className="fixed w-96 bg-white text-black rounded-xl shadow-2xl border border-gray-200 z-[9999] flex flex-col overflow-hidden"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            title="Refresh"
            disabled={loading}
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${
                loading ? "animate-spin" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-emerald-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {notifications.length > 0 && (
        <div className="flex border-b border-gray-200 bg-white">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "read", label: "Read" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                filter === key
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="overflow-y-auto max-h-96">
        {error ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-transparent rounded-full animate-spin mb-3 border-t-blue-600"></div>
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-emerald-100 mb-3">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              No {filter !== "all" && filter} notifications
            </p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
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

      {/* Page_footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-3 text-center bg-gradient-to-r from-gray-50 to-gray-50">
          <Link
            href={`/pages/${user?.userType}/inbox`}
            className="text-sm font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-emerald-700 transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
};

/* =====================================================
   🔹 Mobile Dropdown
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
  <div className="md:hidden fixed top-14 left-0 right-0 bg-white shadow-2xl z-[100] border-b border-gray-200 flex flex-col max-h-[80vh]">
    {/* Header */}
    <div className="flex justify-between items-center border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            {unreadCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm hover:shadow-md"
          disabled={loading}
        >
          <svg
            className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent px-2 py-1.5 rounded-lg hover:bg-blue-50"
          >
            Mark all
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm hover:shadow-md"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto">
      {error ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-emerald-100 mb-3">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
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

    {/* Page_footer */}
    {notifications.length > 0 && (
      <div className="border-t border-gray-200 p-3 text-center bg-gradient-to-r from-gray-50 to-gray-50">
        <Link
          href={`/pages/${user?.userType}/inbox`}
          onClick={onClose}
          className="text-sm font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-emerald-700"
        >
          View all notifications →
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click (desktop only)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block" ref={wrapperRef}>
        <button
          ref={buttonRef}
          onClick={() => setNotifOpen((p) => !p)}
          className="relative p-2 hover:bg-white/10 rounded-lg group transition-all duration-200 border border-white/20 hover:border-white/40"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse shadow-lg">
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
            buttonRef={buttonRef}
          />
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden relative">
        <button
          onClick={() => setNotifOpen((p) => !p)}
          className="relative p-2 hover:bg-white/10 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
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
