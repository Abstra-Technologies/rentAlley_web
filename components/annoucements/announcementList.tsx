"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";
import {
  MegaphoneIcon,
  CalendarIcon,
  ClockIcon,
  PhotoIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface AnnouncementPhoto {
  photo_id: number;
  photo_url: string;
  created_at: string;
}

interface Announcement {
  unique_id: string;
  announcement_id: number | null;
  title: string;
  message: string;
  created_at: string;
  updated_at: string | null;
  photos: AnnouncementPhoto[];
  image_url: string | null;
  source: "system" | "landlord";
  priority?: "urgent" | "important" | "normal";
}

export default function Announcements({
  user_id,
  agreement_id,
}: {
  user_id: number;
  agreement_id?: number;
}) {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const queryParams = new URLSearchParams({
          user_id: user_id.toString(),
        });
        if (agreement_id)
          queryParams.append("agreement_id", agreement_id.toString());

        const response = await axios.get(
          `/api/tenant/announcement/allAnnouncements?${queryParams.toString()}`
        );

        const sortedAnnouncements = response.data.sort(
          (a: Announcement, b: Announcement) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAnnouncements(sortedAnnouncements);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    if (user_id) fetchAnnouncements();
  }, [user_id, agreement_id]);

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const nextPhoto = (photos: AnnouncementPhoto[]) => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (photos: AnnouncementPhoto[]) => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const openModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setCurrentPhotoIndex(0);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading announcements...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <InformationCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-900">
                  Error Loading Announcements
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex-shrink-0">
                <MegaphoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Announcements
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Stay updated with the latest news
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-blue-200 rounded-xl shadow-sm flex-shrink-0 self-start sm:self-auto">
              <span className="text-xl sm:text-2xl font-bold text-blue-600">
                {announcements.length}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-600">
                {announcements.length === 1 ? "Post" : "Posts"}
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {announcements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MegaphoneIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Announcements Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              There are no announcements at this time. Check back later for
              updates from your property management.
            </p>
          </div>
        ) : (
          /* Announcements List */
          <div className="space-y-4 md:space-y-3">
            {announcements.map((announcement, index) => (
              <article
                key={announcement?.unique_id}
                className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden group"
              >
                {/* Announcement Header */}
                <div className="p-4 md:p-5 pb-3 md:pb-4">
                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 md:mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors break-words">
                          {announcement?.title}
                        </h2>
                        {announcement.source === "system" && (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 flex-shrink-0">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          <span>{formatDate(announcement?.created_at)}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          <span>{formatTime(announcement?.created_at)}</span>
                        </div>
                        {announcement.updated_at &&
                          announcement.updated_at !==
                            announcement.created_at && (
                            <>
                              <span className="text-gray-300 hidden sm:inline">
                                •
                              </span>
                              <span className="text-xs text-gray-500 w-full sm:w-auto">
                                Updated {formatDate(announcement.updated_at)}
                              </span>
                            </>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-blue-50 border-2 border-blue-200 text-blue-700 text-xs font-bold rounded-lg whitespace-nowrap">
                        {getTimeAgo(announcement?.created_at)}
                      </span>
                      {announcement.photos &&
                        announcement.photos.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
                            <PhotoIcon className="w-3.5 h-3.5" />
                            {announcement.photos.length}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Priority Badge */}
                  {announcement?.priority && (
                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          announcement.priority === "urgent"
                            ? "bg-red-100 text-red-700 border-2 border-red-200"
                            : announcement.priority === "important"
                            ? "bg-amber-100 text-amber-700 border-2 border-amber-200"
                            : "bg-gray-100 text-gray-700 border-2 border-gray-200"
                        }`}
                      >
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Announcement Image/Photo Gallery */}
                {announcement?.image_url &&
                  typeof announcement.image_url === "string" &&
                  (announcement.image_url.startsWith("http://") ||
                    announcement.image_url.startsWith("https://") ||
                    announcement.image_url.startsWith("/")) && (
                    <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-100">
                      <Image
                        src={announcement.image_url}
                        alt={announcement.title}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => openModal(announcement)}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        unoptimized={
                          !announcement.image_url.startsWith(
                            process.env.NEXT_PUBLIC_BASE_URL || ""
                          )
                        }
                      />
                      {announcement.photos &&
                        announcement.photos.length > 1 && (
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-lg backdrop-blur-sm">
                            1 / {announcement.photos.length} photos
                          </div>
                        )}
                    </div>
                  )}

                {/* Announcement Content - Truncated */}
                <div className="p-4 md:p-5 pt-3 md:pt-4">
                  <div className="prose prose-sm sm:prose max-w-none">
                    <div
                      className="text-gray-700 leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: announcement?.message || "",
                      }}
                    />
                  </div>
                </div>

                {/* Page_footer */}
                <div className="px-4 md:px-5 pb-4 md:pb-4 flex items-center justify-between border-t border-gray-100 pt-3 md:pt-4">
                  <button
                    onClick={() => openModal(announcement)}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 border-2 border-blue-200 hover:border-blue-600 rounded-xl transition-all duration-200"
                  >
                    <span>Read Full Announcement</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Modal with Photo Gallery */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={() => {
            setSelectedAnnouncement(null);
            setCurrentPhotoIndex(0);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
              <div className="flex-1 pr-4 min-w-0">
                <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {selectedAnnouncement?.title}
                  </h3>
                  {selectedAnnouncement.source === "system" && (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 flex-shrink-0">
                      SYSTEM
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    <span>{formatDate(selectedAnnouncement?.created_at)}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    <span>{formatTime(selectedAnnouncement?.created_at)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAnnouncement(null);
                  setCurrentPhotoIndex(0);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            {/* Photo Gallery */}
            {selectedAnnouncement?.photos &&
              selectedAnnouncement.photos.length > 0 &&
              selectedAnnouncement.photos[currentPhotoIndex] &&
              typeof selectedAnnouncement.photos[currentPhotoIndex]
                .photo_url === "string" &&
              (selectedAnnouncement.photos[
                currentPhotoIndex
              ].photo_url.startsWith("http://") ||
                selectedAnnouncement.photos[
                  currentPhotoIndex
                ].photo_url.startsWith("https://") ||
                selectedAnnouncement.photos[
                  currentPhotoIndex
                ].photo_url.startsWith("/")) && (
                <div className="relative w-full h-64 sm:h-96 bg-gray-100">
                  <Image
                    src={
                      selectedAnnouncement.photos[currentPhotoIndex].photo_url
                    }
                    alt={`${selectedAnnouncement.title} - Photo ${
                      currentPhotoIndex + 1
                    }`}
                    fill
                    className="object-contain"
                    unoptimized={
                      !selectedAnnouncement.photos[
                        currentPhotoIndex
                      ].photo_url.startsWith(
                        process.env.NEXT_PUBLIC_BASE_URL || ""
                      )
                    }
                  />

                  {/* Photo Navigation */}
                  {selectedAnnouncement.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => prevPhoto(selectedAnnouncement.photos)}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                      >
                        <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button
                        onClick={() => nextPhoto(selectedAnnouncement.photos)}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/70 hover:bg-black/90 text-white rounded-full backdrop-blur-sm transition-all"
                      >
                        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>

                      {/* Photo Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/70 text-white text-xs sm:text-sm font-bold rounded-full backdrop-blur-sm">
                        {currentPhotoIndex + 1} /{" "}
                        {selectedAnnouncement.photos.length}
                      </div>

                      {/* Photo Thumbnails - Hidden on very small screens */}
                      <div className="hidden sm:flex absolute bottom-4 right-4 gap-2">
                        {selectedAnnouncement.photos
                          .filter(
                            (photo) =>
                              typeof photo.photo_url === "string" &&
                              (photo.photo_url.startsWith("http://") ||
                                photo.photo_url.startsWith("https://") ||
                                photo.photo_url.startsWith("/"))
                          )
                          .map((photo, idx) => (
                            <button
                              key={photo.photo_id}
                              onClick={() => setCurrentPhotoIndex(idx)}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentPhotoIndex
                                  ? "border-blue-500 ring-2 ring-blue-300"
                                  : "border-white/50 hover:border-white"
                              }`}
                            >
                              <Image
                                src={photo.photo_url}
                                alt={`Thumbnail ${idx + 1}`}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                                unoptimized={
                                  !photo.photo_url.startsWith(
                                    process.env.NEXT_PUBLIC_BASE_URL || ""
                                  )
                                }
                              />
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {selectedAnnouncement.updated_at &&
                selectedAnnouncement.updated_at !==
                  selectedAnnouncement.created_at && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-semibold">
                      Last updated:{" "}
                      {formatDate(selectedAnnouncement.updated_at)} at{" "}
                      {formatTime(selectedAnnouncement.updated_at)}
                    </p>
                  </div>
                )}

              <div className="prose prose-sm sm:prose max-w-none">
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: selectedAnnouncement?.message || "",
                  }}
                />
              </div>
            </div>

            {/* Modal Page_footer */}
            <div className="border-t-2 border-gray-200 p-4 sm:p-6">
              <button
                onClick={() => {
                  setSelectedAnnouncement(null);
                  setCurrentPhotoIndex(0);
                }}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
