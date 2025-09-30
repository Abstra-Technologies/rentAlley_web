export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "urgent" | "success" | "info" | "default";
  is_read: boolean;
  created_at: string;
  timestamp?: string;
}

export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return "Just now";

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);


  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

export const getNotificationStyles = (
  type: Notification["type"],
  isRead: boolean
) => {
  const baseStyles = {
    urgent: {
      border: "border-l-red-500",
      bg: isRead ? "bg-white" : "bg-red-50",
      badge: "bg-red-100 text-red-700",
      icon: "text-red-500",
    },
    success: {
      border: "border-l-green-500",
      bg: isRead ? "bg-white" : "bg-green-50",
      badge: "bg-green-100 text-green-700",
      icon: "text-green-500",
    },
    info: {
      border: "border-l-blue-500",
      bg: isRead ? "bg-white" : "bg-blue-50",
      badge: "bg-blue-100 text-blue-700",
      icon: "text-blue-500",
    },
    default: {
      border: "border-l-gray-300",
      bg: isRead ? "bg-white" : "bg-gray-50",
      badge: "bg-gray-100 text-gray-700",
      icon: "text-gray-500",
    },
  };

  return baseStyles[type] || baseStyles.default;
};
