"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MegaphoneIcon,
  CalendarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
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

// Lightbox Modal for Full Image View
function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
        aria-label="Close"
      >
        <XMarkIcon className="w-6 h-6 text-white" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
          <span className="text-white font-semibold text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Announcement image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}

export default function AnnouncementFeeds({
  tenant_id,
}: {
  tenant_id?: number;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!tenant_id) {
      setLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/tenant/activeRent/announcement?tenant_id=${tenant_id}`
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch announcements");
        }
        const data = await res.json();
        setAnnouncements(data.announcements || data || []);
      } catch (err: any) {
        console.error("Announcement fetch error:", err);
        setError(err.message || "Unable to load announcements");
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

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "High Priority",
      },
      medium: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        label: "Medium",
      },
      low: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Low",
      },
    };
    const config = configs[priority as keyof typeof configs] || configs.low;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  // Pagination
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(announcements.length / itemsPerPage);

  if (loading) {
    return (
      <div className="p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 sm:p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MegaphoneIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Unable to Load
          </h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!announcements.length) {
    return (
      <div className="p-8 sm:p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <MegaphoneIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Announcements Yet
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Stay tuned! Your landlord will post important updates and
            announcements here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <ImageLightbox
          images={selectedImages}
          currentIndex={currentImageIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <MegaphoneIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
          </div>
          <p className="text-sm text-gray-600">
            {announcements.length}{" "}
            {announcements.length === 1 ? "announcement" : "announcements"}
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {paginatedAnnouncements.map((announcement) => (
            <article
              key={announcement.id}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Images Section - Full Width Hero */}
              {announcement.photos &&
                announcement.photos.length > 0 && (
                  <div className="relative bg-gradient-to-br from-slate-100 to-gray-100">
                    {announcement.photos.length === 1 ? (
                      <button
                        onClick={() =>
                          openLightbox(
                            announcement.photos || [],
                            0
                          )
                        }
                        className="relative w-full h-64 sm:h-80 overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={announcement.photos[0]}
                          alt={announcement.subject}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 backdrop-blur-sm rounded-full p-3">
                            <PhotoIcon className="w-6 h-6 text-gray-900" />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {announcement.photos
                          .slice(0, 4)
                          .map((photo, index) => {
                            const totalPhotos =
                              announcement.photos?.length || 0;
                            const remainingCount = totalPhotos - 4;

                            return (
                              <button
                                key={index}
                                onClick={() =>
                                  openLightbox(
                                    announcement.photos || [],
                                    index
                                  )
                                }
                                className={`relative overflow-hidden rounded-xl group cursor-pointer ${
                                  index === 0
                                    ? "col-span-2 h-64 sm:h-80"
                                    : "h-40 sm:h-48"
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`${announcement.subject} - Image ${
                                    index + 1
                                  }`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {index === 3 && remainingCount > 0 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">
                                      +{remainingCount}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 backdrop-blur-sm rounded-full p-2">
                                    <PhotoIcon className="w-5 h-5 text-gray-900" />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

              {/* Content Section */}
              <div className="p-6">
                {/* Header with Priority */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1">
                    {announcement.subject}
                  </h3>
                  {announcement.priority && getPriorityBadge(announcement.priority)}
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                  {announcement.description}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {formatDate(announcement.created_at)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
