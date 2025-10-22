"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  SparklesIcon,
  BellAlertIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  CalendarIcon,
  HomeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

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

// Auto-categorize based on keywords in subject/description
const categorizeAnnouncement = (announcement: Announcement) => {
  const text =
    `${announcement.subject} ${announcement.description}`.toLowerCase();

  if (
    text.includes("urgent") ||
    text.includes("emergency") ||
    text.includes("immediate")
  ) {
    return {
      type: "urgent",
      label: "Urgent",
      color: "red",
      icon: BellAlertIcon,
    };
  }
  if (
    text.includes("maintenance") ||
    text.includes("repair") ||
    text.includes("cleaning")
  ) {
    return {
      type: "maintenance",
      label: "Maintenance",
      color: "amber",
      icon: WrenchScrewdriverIcon,
    };
  }
  if (
    text.includes("payment") ||
    text.includes("rent") ||
    text.includes("billing") ||
    text.includes("fee")
  ) {
    return {
      type: "payment",
      label: "Payment",
      color: "blue",
      icon: BanknotesIcon,
    };
  }
  if (
    text.includes("event") ||
    text.includes("meeting") ||
    text.includes("gathering")
  ) {
    return {
      type: "event",
      label: "Event",
      color: "emerald",
      icon: CalendarIcon,
    };
  }
  if (
    text.includes("policy") ||
    text.includes("rule") ||
    text.includes("regulation")
  ) {
    return {
      type: "policy",
      label: "Policy Update",
      color: "purple",
      icon: InformationCircleIcon,
    };
  }
  return {
    type: "general",
    label: "General",
    color: "gray",
    icon: InformationCircleIcon,
  };
};

const getPriorityColors = (type: string) => {
  const colors = {
    urgent: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-700 border-red-200",
      icon: "text-red-600",
      hover: "hover:border-red-300",
    },
    maintenance: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "text-amber-600",
      hover: "hover:border-amber-300",
    },
    payment: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      icon: "text-blue-600",
      hover: "hover:border-blue-300",
    },
    event: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: "text-emerald-600",
      hover: "hover:border-emerald-300",
    },
    policy: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      icon: "text-purple-600",
      hover: "hover:border-purple-300",
    },
    general: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      icon: "text-gray-600",
      hover: "hover:border-gray-300",
    },
  };
  return colors[type as keyof typeof colors] || colors.general;
};

export default function AnnouncementFeed({
  tenant_id,
}: {
  tenant_id: number | undefined;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");

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

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!tenant_id) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <InformationCircleIcon className="w-12 h-12 text-gray-300 mb-3" />
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
          <BellAlertIcon className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full mb-4">
          <InformationCircleIcon className="w-10 h-10 text-emerald-600" />
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

  // Categorize all announcements
  const categorizedAnnouncements = announcements.map((a) => ({
    ...a,
    category: categorizeAnnouncement(a),
  }));

  // Get unique categories for filter
  const categories = Array.from(
    new Set(categorizedAnnouncements.map((a) => a.category.type))
  );

  // Filter announcements
  const filteredAnnouncements =
    filterType === "all"
      ? categorizedAnnouncements
      : categorizedAnnouncements.filter((a) => a.category.type === filterType);

  return (
    <div className="w-full">
      {/* Integrated Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <SparklesIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Announcements & Notices
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {announcements.length}{" "}
                {announcements.length === 1 ? "notice" : "notices"}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  filterType === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {categories.map((cat) => {
                const sample = categorizedAnnouncements.find(
                  (a) => a.category.type === cat
                );
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                      filterType === cat
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {sample?.category.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Announcement List - Professional Notice Board Style */}
      <div className="divide-y divide-gray-100">
        {filteredAnnouncements.map((announcement) => {
          const colors = getPriorityColors(announcement.category.type);
          const Icon = announcement.category.icon;
          const isExpanded = expandedIds.has(announcement.id);

          return (
            <article
              key={announcement.id}
              className={`transition-all ${colors.bg} ${colors.border} ${colors.hover} border-l-4`}
            >
              {/* Compact Header - Always Visible */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {/* Category Icon */}
                  <div
                    className={`p-2 bg-white rounded-lg shadow-sm flex-shrink-0 ${colors.icon}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge}`}
                          >
                            {announcement.category.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              announcement.created_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                          {announcement.subject || "Property Notice"}
                        </h3>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleExpand(announcement.id)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Property/Unit Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <HomeIcon className="w-4 h-4" />
                      <span className="font-medium">
                        {announcement.property_name}
                      </span>
                      {announcement.unit_name && (
                        <>
                          <span>•</span>
                          <span>Unit {announcement.unit_name}</span>
                        </>
                      )}
                    </div>

                    {/* Preview Text (when collapsed) */}
                    {!isExpanded && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {announcement.description}
                      </p>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Full Description */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {announcement.description}
                          </p>
                        </div>

                        {/* Photos */}
                        {announcement.photos &&
                          announcement.photos.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                                Attachments ({announcement.photos.length})
                              </p>
                              <div
                                className={`grid gap-3 ${
                                  announcement.photos.length === 1
                                    ? "grid-cols-1"
                                    : "grid-cols-2 sm:grid-cols-3"
                                }`}
                              >
                                {announcement.photos.map((photo, idx) => (
                                  <div
                                    key={idx}
                                    className="relative overflow-hidden rounded-lg bg-gray-100 h-32 sm:h-40 group cursor-pointer"
                                  >
                                    <Image
                                      src={photo}
                                      alt={`Attachment ${idx + 1}`}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                                      sizes="(max-width: 640px) 50vw, 33vw"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Landlord Info */}
                        {announcement.landlord && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                            {announcement.landlord.profilePicture ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-200 flex-shrink-0">
                                <Image
                                  src={announcement.landlord.profilePicture}
                                  alt="Posted by"
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {announcement.landlord.firstName?.charAt(0) ||
                                  "L"}
                              </div>
                            )}
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Posted by:</span>{" "}
                              {announcement.landlord.firstName}{" "}
                              {announcement.landlord.lastName}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Action Hint */}
                    {!isExpanded && (
                      <button
                        onClick={() => toggleExpand(announcement.id)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 mt-1"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Load More Button */}
      {filteredAnnouncements.length > 0 && announcements.length > 10 && (
        <div className="px-6 py-6 text-center bg-gray-50 border-t border-gray-100">
          <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm">
            Load More Announcements
          </button>
        </div>
      )}
    </div>
  );
}
