"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClockIcon,
  XMarkIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface Announcement {
  announcement_id: number;
  subject: string;
  description: string;
  created_at: string;
  photo_urls: string[];
}

interface AnnouncementWidgetProps {
  agreement_id: string | number;
}

export default function AnnouncementWidget({
  agreement_id,
}: AnnouncementWidgetProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          const sanitized = response.data.announcements.map((ann) => ({
            ...ann,
            photo_urls: Array.isArray(ann.photo_urls) ? ann.photo_urls : [],
          }));
          setAnnouncements(sanitized);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        if (active) {
          setError(
            err.response?.data?.message || "Failed to fetch announcements."
          );
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

  const openImageGallery = (photos: string[], startIndex: number = 0) => {
    setSelectedImages(photos);
    setCurrentImageIndex(startIndex);
  };

  const closeImageGallery = () => {
    setSelectedImages(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedImages) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
    }
  };

  const previousImage = () => {
    if (selectedImages) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
      );
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        new URL(url);
        return true;
      }
      if (url.startsWith("/")) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const showLoading = loading;
  const showError = !loading && error;
  const showEmpty = !loading && !error && announcements.length === 0;
  const recentAnnouncements = announcements.slice(0, 5);

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
      {/* LOADING STATE */}
      {showLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-1 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {showError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            No announcements
          </p>
          <p className="text-xs text-gray-500">
            You'll see property updates here when available
          </p>
        </div>
      )}

      {/* ANNOUNCEMENTS TIMELINE */}
      {!showLoading && !showError && announcements.length > 0 && (
        <div className="space-y-4">
          {recentAnnouncements.map((announcement, index) => {
            const validPhotos = announcement.photo_urls.filter(isValidImageUrl);
            const isFirst = index === 0;

            return (
              <div
                key={announcement.announcement_id}
                className="flex gap-3 group"
              >
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isFirst
                        ? "bg-blue-500 ring-4 ring-blue-100"
                        : "bg-gray-300"
                    }`}
                  />
                  {index < recentAnnouncements.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-2" />
                  )}
                </div>

                {/* Content Card */}
                <div className="flex-1 pb-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">
                        {announcement.subject}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatDate(announcement.created_at)}</span>
                        {isFirst && (
                          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold uppercase tracking-wide">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                    {announcement.description}
                  </p>

                  {/* Images */}
                  {validPhotos.length > 0 && (
                    <div className="mt-3">
                      {validPhotos.length === 1 ? (
                        <div
                          className="relative w-full h-40 rounded-lg overflow-hidden cursor-pointer group/image bg-gray-100 border border-gray-200"
                          onClick={() => openImageGallery(validPhotos, 0)}
                        >
                          <Image
                            src={validPhotos[0]}
                            alt={announcement.subject}
                            fill
                            className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                              <PhotoIcon className="w-5 h-5 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {validPhotos.slice(0, 3).map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group/image bg-gray-100 border border-gray-200"
                              onClick={() => openImageGallery(validPhotos, idx)}
                            >
                              <Image
                                src={url}
                                alt={`${announcement.subject} ${idx + 1}`}
                                fill
                                className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                              />
                              {idx === 2 && validPhotos.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    +{validPhotos.length - 3}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* View More */}
          {announcements.length > 5 && (
            <div className="flex gap-3">
              <div className="w-2" />
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                View {announcements.length - 5} more announcements →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image Gallery Modal */}
      {selectedImages && selectedImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeImageGallery}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            onClick={closeImageGallery}
          >
            <XMarkIcon className="w-6 h-6 text-gray-900" />
          </button>

          {selectedImages.length > 1 && (
            <>
              <button
                className="absolute left-4 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
              >
                <ChevronLeftIcon className="w-6 h-6 text-gray-900" />
              </button>
              <button
                className="absolute right-4 p-3 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRightIcon className="w-6 h-6 text-gray-900" />
              </button>
            </>
          )}

          {selectedImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white rounded-full z-10">
              <span className="text-sm font-semibold text-gray-900">
                {currentImageIndex + 1} / {selectedImages.length}
              </span>
            </div>
          )}

          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImages[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/90 rounded-lg max-w-lg overflow-x-auto">
              {selectedImages.map((url, idx) => (
                <button
                  key={idx}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    idx === currentImageIndex
                      ? "border-blue-500 scale-110"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
