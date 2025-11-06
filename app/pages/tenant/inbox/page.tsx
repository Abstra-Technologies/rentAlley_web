"use client";

import { useState, useEffect, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import useAuth from "@/hooks/useSession";
import NotificationItem from "@/components/notification/notificationItem";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(user?.user_id);

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    if (filter === "read") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [notifications, filter]);

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount,
    }),
    [notifications.length, unreadCount]
  );

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <TenantOutsidePortalNav />

      <div className="flex-1 md:ml-64">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">
                    Stay updated with your activity
                  </p>
                </div>
              </div>

              {/* Quick Actions - Desktop */}
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg shadow-sm"
                  >
                    <span className="text-sm font-bold">{unreadCount} New</span>
                  </motion.div>
                )}

                <button
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 border border-gray-200"
                  title="Refresh notifications"
                >
                  <ArrowPathIcon
                    className={`w-5 h-5 text-gray-600 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-100 hover:border-blue-200 transition-all text-center"
            >
              <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                {stats.total}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-4 sm:p-5 border-2 border-blue-200 hover:border-emerald-300 transition-all text-center"
            >
              <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Unread
              </p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.unread}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 sm:p-5 border-2 border-emerald-100 hover:border-emerald-200 transition-all text-center"
            >
              <p className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Read
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {stats.read}
              </p>
            </motion.div>
          </div>

          {/* Filter and Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                {(["all", "unread", "read"] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      filter === filterOption
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() +
                      filterOption.slice(1)}
                  </button>
                ))}
              </div>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 font-semibold text-sm"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>{isMarkingAll ? "Marking..." : "Mark All Read"}</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Notifications List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {loading && notifications.length === 0 ? (
              // Loading Skeleton
              <div className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 sm:p-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error State
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Error Loading Notifications
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => fetchNotifications(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              // Empty State
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellIcon className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {filter === "unread"
                    ? "All Caught Up!"
                    : filter === "read"
                    ? "No Read Notifications"
                    : "No Notifications Yet"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {filter === "unread"
                    ? "You've read all your notifications. Great job staying on top of things!"
                    : filter === "read"
                    ? "You haven't read any notifications yet."
                    : "You'll see notifications here when you receive them."}
                </p>
              </div>
            ) : (
              // Notifications List
              <div className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Results Summary */}
          {filteredNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {filteredNotifications.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">
                  {notifications.length}
                </span>{" "}
                {notifications.length === 1 ? "notification" : "notifications"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
