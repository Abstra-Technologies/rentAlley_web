"use client";

import { useEffect, useState } from "react";
import { Megaphone, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";

interface Announcement {
  id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  created_at: string;
  photos: string[];
  landlord?: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}

export default function AnnouncementFeed({
  tenant_id,
}: {
  tenant_id: number | undefined;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant_id) return;

    setLoading(true);
    setError(null);
    fetch(`/api/tenant/activeRent/announcement?tenant_id=${tenant_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch announcements");
        return res.json();
      })
      .then((data) => setAnnouncements(data.announcements || []))
      .catch((err) => {
        console.error(err);
        setError("Unable to load announcements");
      })
      .finally(() => setLoading(false));
  }, [tenant_id]);

  if (!tenant_id) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Megaphone className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">
          Please log in to view announcements
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-100 border-t-emerald-500 mb-3"></div>
        <p className="text-gray-500 font-medium">Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-3 bg-red-100 rounded-full mb-3">
          <Megaphone className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full mb-4">
          <Megaphone className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          No Announcements Yet
        </h3>
        <p className="text-gray-600 text-center text-sm">
          Check back soon for updates from your landlord
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:border-emerald-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {announcement.landlord?.profilePicture ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-200">
                    <Image
                      src={announcement.landlord.profilePicture}
                      alt="Landlord"
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {announcement.landlord?.firstName?.charAt(0) || "L"}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {announcement.landlord?.firstName}{" "}
                  {announcement.landlord?.lastName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">
                    {announcement.property_name}
                  </span>
                  {announcement.unit_name && (
                    <>
                      {" "}
                      · Unit{" "}
                      <span className="font-semibold text-gray-700">
                        {announcement.unit_name}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(announcement.created_at).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>

            {/* Subject & Description */}
            <div>
              {announcement.subject && (
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {announcement.subject}
                </h2>
              )}
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
                {announcement.description}
              </p>
            </div>
          </div>

          {/* Photos */}
          {announcement.photos && announcement.photos.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div
                className={`grid gap-3 ${
                  announcement.photos.length === 1
                    ? "grid-cols-1"
                    : announcement.photos.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {announcement.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl max-h-80 bg-gray-200"
                  >
                    <Image
                      src={photo}
                      alt={`Announcement photo ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 text-sm">
            <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-semibold transition-colors group">
              <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Like</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors group">
              <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div> */}
        </article>
      ))}
    </div>
  );
}
