import { useEffect, useState } from "react";
import axios from "axios";
import { MegaphoneIcon, ClockIcon } from "@heroicons/react/24/outline";

interface Announcement {
  announcement_id: number;
  subject: string;
  description: string;
  created_at: string;
}

interface AnnouncementWidgetProps {
  agreement_id: number;
}

export default function AnnouncementWidget({ agreement_id }: AnnouncementWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agreement_id) return;

    let active = true;

    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const response = await axios.get<{ announcements: Announcement[] }>(
          `/api/tenant/announcement/getAnnouncementPerProperty?agreement_id=${agreement_id}`
        );

        if (active) {
          setAnnouncements(response.data.announcements || []);
        }
      } catch (err: any) {
        if (active) {
          setError(err.response?.data?.message || "Failed to fetch announcements.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAnnouncements();

    return () => {
      active = false;
    };
  }, [agreement_id]);

  // ------------------------------------
  // NO EARLY RETURNS — HANDLE STATES BELOW
  // ------------------------------------
  const showLoading = loading;
  const showError = !loading && error;
  const showEmpty = !loading && !error && announcements.length === 0;

  const recentAnnouncements = announcements.slice(0, 5);

  const getPriorityGradient = (index: number) => {
    const gradients = [
      "from-blue-50 to-cyan-50",
      "from-emerald-50 to-teal-50",
      "from-indigo-50 to-blue-50",
      "from-purple-50 to-indigo-50",
      "from-cyan-50 to-blue-50",
    ];
    return gradients[index % gradients.length];
  };

  const getPriorityBorder = (index: number) => {
    const borders = [
      "border-blue-200",
      "border-emerald-200",
      "border-indigo-200",
      "border-purple-200",
      "border-cyan-200",
    ];
    return borders[index % borders.length];
  };

  const getDotColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-cyan-500",
    ];
    return colors[index % colors.length];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
          <MegaphoneIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Announcements</h3>
          <p className="text-xs text-gray-600">Property updates & notices</p>
        </div>
      </div>

      {/* --------------------------------
           LOADING STATE
      -------------------------------- */}
      {showLoading && (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      )}

      {/* --------------------------------
           ERROR STATE
      -------------------------------- */}
      {showError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* --------------------------------
           EMPTY STATE
      -------------------------------- */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mb-4">
            <MegaphoneIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">No Announcements</h4>
          <p className="text-sm text-gray-600 max-w-xs">
            Check back for important property updates and notices from your landlord.
          </p>
        </div>
      )}

      {/* --------------------------------
           ANNOUNCEMENTS LIST
      -------------------------------- */}
      {!showLoading && !showError && announcements.length > 0 && (
        <>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-96">
            {recentAnnouncements.map((announcement, index) => (
              <article
                key={announcement.announcement_id}
                className={`group rounded-xl border-2 ${getPriorityBorder(
                  index
                )} bg-gradient-to-br ${getPriorityGradient(
                  index
                )} p-4 hover:shadow-lg transition-all duration-300`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getDotColor(index)} ${
                        index === 0 ? "animate-pulse" : ""
                      }`}
                    />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      {index === 0 ? "Latest" : "Update"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {announcement.subject}
                </h4>
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {announcement.description}
                </p>

                {announcement.description.length > 150 && (
                  <button className="mt-3 text-xs font-semibold text-blue-600 hover:text-emerald-600 transition-colors">
                    Read more →
                  </button>
                )}
              </article>
            ))}
          </div>

          {/* View All */}
          {announcements.length > 5 && (
            <div className="mt-6 pt-4 border-t-2 border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-blue-600">
                  +{announcements.length - 5}
                </span>{" "}
                more{" "}
                {announcements.length - 5 === 1 ? "announcement" : "announcements"}
              </p>
              <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-emerald-600 transition-colors">
                View all announcements →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
