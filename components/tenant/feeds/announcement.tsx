"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Announcement {
  id: number;
  subject: string;
  description: string;
  property_name: string;
  unit_name: string;
  created_at: string;
  photos?: string[];
  priority?: "high" | "medium" | "low";
  landlord?: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <XMarkIcon className="w-6 h-6 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      <img
        src={images[currentIndex]}
        alt="Announcement"
        className="max-w-[90%] max-h-[85vh] rounded-lg object-contain"
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementFeeds({
  tenant_id,
  maxItems = 5,
  showViewAll = true,
}: {
  tenant_id?: number;
  maxItems?: number;
  showViewAll?: boolean;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [displayedAnnouncements, setDisplayedAnnouncements] = useState<
    Announcement[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!tenant_id) {
      setLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/tenant/activeRent/announcement?tenant_id=${tenant_id}`
        );
        if (!res.ok) throw new Error("Failed to fetch announcements");
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [tenant_id]);

  useEffect(() => {
    // Control how many items to display
    if (showAll) {
      setDisplayedAnnouncements(announcements);
    } else {
      setDisplayedAnnouncements(announcements.slice(0, maxItems));
    }
  }, [announcements, showAll, maxItems]);

  const openLightbox = (images: string[], index: number) => {
    setSelectedImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const hasMore = announcements.length > maxItems;

  /* ==============================
    Loading / Error / Empty States
  ===============================*/

  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"></div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <MegaphoneIcon className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600 font-semibold text-sm">
          {error || "Failed to load announcements."}
        </p>
      </div>
    );

  if (!announcements.length)
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MegaphoneIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 font-medium">
          No announcements yet.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Check back later for updates from your landlord.
        </p>
      </div>
    );

  /* ==============================
        MAIN FEED
  ===============================*/

  return (
    <>
      {lightboxOpen && (
        <ImageLightbox
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() =>
            setCurrentImageIndex((i) => (i + 1) % selectedImages.length)
          }
          onPrev={() =>
            setCurrentImageIndex(
              (i) => (i - 1 + selectedImages.length) % selectedImages.length
            )
          }
        />
      )}

      <div className="space-y-4">
        {displayedAnnouncements.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* Status Bar */}
            <div className="h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />

            <div className="p-4">
              {/* HEADER */}
              <div className="flex items-start gap-3 mb-3">
                {a.landlord?.profilePicture ? (
                  <img
                    src={a.landlord.profilePicture}
                    alt="Landlord"
                    className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircleIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {a.landlord
                      ? `${a.landlord.firstName} ${a.landlord.lastName}`
                      : "Landlord"}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5">
                    {a.property_name && (
                      <span className="text-xs font-medium text-blue-600">
                        {a.property_name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(a.created_at)}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MegaphoneIcon className="w-4 h-4 text-blue-600" />
                </div>
              </div>

              {/* SUBJECT + BODY */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-base">
                  {a.subject}
                </h3>

                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                  {a.description}
                </p>

                {/* IMAGES */}
                {a.photos?.length ? (
                  <div
                    className={`grid gap-2 mt-3 ${
                      a.photos.length === 1
                        ? "grid-cols-1"
                        : a.photos.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-2"
                    }`}
                  >
                    {a.photos.slice(0, 4).map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => openLightbox(a.photos!, index)}
                        className="relative overflow-hidden rounded-lg group"
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-40 sm:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />

                        {index === 3 && a.photos.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                            +{a.photos.length - 4}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {/* Show More / View All Actions */}
        {hasMore && !showAll && showViewAll && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:shadow-md transition-all"
            >
              Show More Announcements
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {showAll && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAll(false)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Show Less
            </button>
          </div>
        )}
      </div>
    </>
  );
}
