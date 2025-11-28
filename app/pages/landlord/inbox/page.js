"use client";

import { useState, useEffect, useCallback } from "react";
import useAuthStore from "../../../../zustand/authStore";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Wrench,
  UserCheck,
  UserPlus,
  Home,
  FileCheck,
  XCircle,
  Key,
} from "lucide-react";

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";

    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (title, type) => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("maintenance")) {
      return <Wrench className="w-5 h-5 text-red-600" />;
    }
    if (titleLower.includes("application")) {
      return <UserPlus className="w-5 h-5 text-blue-600" />;
    }
    if (titleLower.includes("proceed")) {
      return <UserCheck className="w-5 h-5 text-emerald-600" />;
    }
    if (
      titleLower.includes("invite accepted") ||
      titleLower.includes("lease")
    ) {
      return <Key className="w-5 h-5 text-emerald-600" />;
    }
    if (titleLower.includes("verified")) {
      return <FileCheck className="w-5 h-5 text-emerald-600" />;
    }
    if (titleLower.includes("rejected")) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    if (titleLower.includes("property")) {
      return <Home className="w-5 h-5 text-blue-600" />;
    }

    switch (type) {
      case "urgent":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBorderColor = (title, type) => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("maintenance") || type === "urgent") {
      return "border-l-red-500";
    }
    if (titleLower.includes("verified") || titleLower.includes("accepted")) {
      return "border-l-emerald-500";
    }
    if (titleLower.includes("rejected")) {
      return "border-l-red-500";
    }
    if (titleLower.includes("application") || titleLower.includes("proceed")) {
      return "border-l-blue-500";
    }

    return "border-l-gray-300";
  };

  const getBackgroundColor = (title, type, isRead) => {
    if (isRead) return "bg-white";

    const titleLower = title.toLowerCase();

    if (titleLower.includes("maintenance") || type === "urgent") {
      return "bg-red-50";
    }
    if (titleLower.includes("verified") || titleLower.includes("accepted")) {
      return "bg-emerald-50";
    }
    if (titleLower.includes("application") || titleLower.includes("proceed")) {
      return "bg-blue-50";
    }

    return "bg-gray-50";
  };

  return (
    <div
      className={`group relative border-l-4 ${getBorderColor(
        notification.title,
        notification.type
      )} ${getBackgroundColor(
        notification.title,
        notification.type,
        notification.is_read
      )} hover:bg-gray-50 transition-all duration-200 p-3 border-b border-gray-100 last:border-b-0`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.title, notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3
                className={`text-sm text-gray-900 line-clamp-2 ${
                  !notification.is_read ? "font-semibold" : "font-medium"
                }`}
              >
                {notification.title}
              </h3>
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!notification.is_read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="p-1.5 hover:bg-blue-100 rounded-full transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-3">
            {notification.body}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.created_at || notification.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LandlordNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { user } = useAuthStore();

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      if (!user || !user.user_id) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const userId = encodeURIComponent(user.user_id);
        const response = await fetch(
          `/api/notification/getNotifications?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        const notificationsArray = Array.isArray(data) ? data : [];

        const sortedNotifications = notificationsArray.sort(
          (a, b) =>
            new Date(b.created_at || b.timestamp) -
            new Date(a.created_at || a.timestamp)
        );

        setNotifications(sortedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = notifications.filter((n) => !n.is_read);
    } else if (filter === "read") {
      filtered = notifications.filter((n) => n.is_read);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, filter]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

  const markAsRead = async (id) => {
    try {
      const response = await fetch("/api/notification/markSingleRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      const response = await fetch("/api/notification/markAllAsRead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: unreadNotifications.map((n) => n.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notification/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 text-sm">
              Stay updated with your property activities
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {notifications.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg border border-blue-200 p-3 text-center">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
              Unread
            </p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">
              Read
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {notifications.length - unreadCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
          <div className="flex flex-col gap-3">
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              {[
                { key: "all", label: "All", count: notifications.length },
                { key: "unread", label: "Unread", count: unreadCount },
                {
                  key: "read",
                  label: "Read",
                  count: notifications.length - unreadCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    filter === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600">
                {filteredNotifications.length} result
                {filteredNotifications.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => fetchNotifications(true)}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 border border-gray-200"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-gray-600 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-6">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse p-3">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Error loading notifications
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchNotifications(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                {filter === "unread"
                  ? "All caught up!"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h3>
              <p className="text-sm text-gray-600">
                {filter === "all" &&
                  "You'll see notifications here when you receive them"}
              </p>
            </div>
          ) : (
            <div>
              {paginatedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > itemsPerPage && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-600 text-center">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(endIndex, filteredNotifications.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {filteredNotifications.length}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
