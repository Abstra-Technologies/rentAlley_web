import { useEffect, useState } from "react";
import axios from "axios";

interface Announcement {
  announcement_id: number;
  subject: string;
  description: string;
  created_at: string;
}

interface AnnouncementWidgetProps {
  agreement_id: number;
}

export default function AnnouncementWidget({
  agreement_id,
}: AnnouncementWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await axios.get<{ announcements: Announcement[] }>(
          `/api/tenant/announcement/getAnnouncementPerProperty?agreement_id=${agreement_id}`
        );
        setAnnouncements(response.data.announcements);
      } catch (err: any) {
        console.error("Error fetching announcements:", err);
        setError(
          err.response?.data?.message || "Failed to fetch announcements."
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchAnnouncements();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
        <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!announcements.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl">📢</span>
        </div>
        <div>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            No Announcements
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Check back for important property updates.
          </p>
        </div>
      </div>
    );
  }

  const recentAnnouncements = announcements.slice(0, 3);

  const getPriorityColor = (index: number) => {
    const colors = [
      "from-blue-50 to-cyan-50",
      "from-emerald-50 to-teal-50",
      "from-indigo-50 to-blue-50",
    ];
    return colors[index % colors.length];
  };

  const getPriorityBorder = (index: number) => {
    const borders = [
      "border-blue-200",
      "border-emerald-200",
      "border-indigo-200",
    ];
    return borders[index % borders.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile optimized */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">📣</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Announcements
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-9 sm:ml-10">Property updates</p>
      </div>

      {/* Announcements List - Touch friendly */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        {recentAnnouncements.map((announcement, index) => (
          <div
            key={announcement.announcement_id}
            className={`group p-3 sm:p-4 bg-gradient-to-br ${getPriorityColor(
              index
            )} border ${getPriorityBorder(
              index
            )} rounded-lg sm:rounded-xl hover:shadow-md transition-all active:scale-95 sm:active:scale-100`}
          >
            {/* Badge and Date */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    index === 0
                      ? "bg-blue-500"
                      : index === 1
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
                  }`}
                ></span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-tight truncate">
                  {index === 0 ? "Latest" : "Update"}
                </span>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                {formatDate(announcement.created_at)}
              </span>
            </div>

            {/* Subject */}
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2">
              {announcement.subject}
            </h4>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 leading-relaxed">
              {announcement.description}
            </p>
          </div>
        ))}
      </div>

      {/* View All Link */}
      {announcements.length > 3 && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs text-center text-gray-600">
            <span className="font-semibold text-blue-600">
              {announcements.length - 3}
            </span>
            <span>
              {" "}
              more announcement{announcements.length - 3 > 1 ? "s" : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
