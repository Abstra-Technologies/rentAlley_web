"use client";

import { useState, useEffect, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import useAuth from "@/hooks/useSession";
import NotificationItem from "@/components/notification/notificationItem";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Trash2,
} from "lucide-react";
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

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    if (filter === 'read') return notifications.filter(n => n.is_read);
    return notifications;
  }, [notifications, filter]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
  }), [notifications.length, unreadCount]);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl">
                <Bell className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  Notifications
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Stay updated with your latest activity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-sm"
                >
                  {unreadCount} new
                </motion.span>
              )}

              <button
                onClick={() => fetchNotifications(true)}
                disabled={loading}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors duration-200 disabled:opacity-50 border border-gray-200"
                title="Refresh notifications"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            {[
              { label: 'Total', value: stats.total, color: 'from-gray-500 to-gray-600' },
              { label: 'Unread', value: stats.unread, color: 'from-blue-500 to-emerald-500' },
              { label: 'Read', value: stats.read, color: 'from-emerald-500 to-blue-500' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-100">
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
              {(['all', 'unread', 'read'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === filterOption
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isMarkingAll ? 'Marking...' : 'Mark all read'}
                </span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {loading && notifications.length === 0 ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse border-l-4 border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex gap-4">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error loading notifications
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchNotifications(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' && "You'll see notifications here when you receive them"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
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
      </div>
    </div>
  );
}