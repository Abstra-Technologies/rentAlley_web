"use client";

/**
 * Compact Mobile-Optimized Announcement Widget
 * Updated: November 2025
 */

import { useEffect, useState } from "react";
import {
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
      >
        <XMarkIcon className="w-5 h-5 text-white" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <ChevronRightIcon className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      <img
        src={images[currentIndex]}
        alt="Announcement"
        className="max-w-[90%] max-h-[85vh] rounded-lg object-contain"
      />
    </div>
  );
}

export default function AnnouncementFeeds({ tenant_id }: { tenant_id?: number }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!tenant_id) {
      setLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenant/activeRent/announcement?tenant_id=${tenant_id}`);
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

  /* ==============================
    Loading / Error / Empty States
  ===============================*/

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-emerald-500 rounded-full"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600 font-medium text-sm">
        {error || "Failed to load announcements."}
      </div>
    );

  if (!announcements.length)
    return (
      <div className="p-6 text-center text-gray-600">
        <MegaphoneIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm">No announcements yet.</p>
      </div>
    );

  /* ==============================
        MAIN FEED — COMPACT
  ===============================*/

  return (
    <>
      {lightboxOpen && (
        <ImageLightbox
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setCurrentImageIndex((i) => (i + 1) % selectedImages.length)}
          onPrev={() =>
            setCurrentImageIndex((i) => (i - 1 + selectedImages.length) % selectedImages.length)
          }
        />
      )}

      <div className="flex flex-col gap-4 p-3 sm:p-4">

        {announcements.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-3 sm:p-4"
          >
            {/* HEADER */}
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              <img
                src={
                  a.landlord?.profilePicture ||
                  "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                }
                alt="Landlord"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-gray-200 object-cover"
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                  {a.landlord
                    ? `${a.landlord.firstName} ${a.landlord.lastName}`
                    : "Landlord"}
                </p>

                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
                  {a.property_name && (
                    <span className="font-medium text-emerald-600">{a.property_name}</span>
                  )}{" "}
                  • {formatDate(a.created_at)}
                </p>
              </div>

              <MegaphoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-1" />
            </div>

            {/* SUBJECT + BODY */}
            <div className="ml-11 sm:ml-14">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5">
                {a.subject}
              </h3>

              <p className="text-[12px] sm:text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                {a.description}
              </p>

              {/* IMAGES */}
              {a.photos?.length ? (
                <div
                  className={`grid gap-1.5 sm:gap-2 ${
                    a.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  {a.photos.slice(0, 4).map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(a.photos!, index)}
                      className="relative overflow-hidden rounded-lg"
                    >
                      <img
                        src={photo}
                        className="w-full h-32 sm:h-40 object-cover rounded-lg hover:scale-105 transition"
                      />

                      {index === 3 && a.photos.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                          +{a.photos.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
