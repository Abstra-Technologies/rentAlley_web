"use client";

/**
 * @component     Announcement Widget
 * @desc         Displays all announcements
 * @usedBy      Tenant Feeds page
 * @dateUpdate   November 10, 2025
 */

import { useEffect, useState } from "react";
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
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
                <XMarkIcon className="w-6 h-6 text-white" />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={onNext}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                    >
                        <ChevronRightIcon className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            <img
                src={images[currentIndex]}
                alt="Announcement"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
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

    const closeLightbox = () => setLightboxOpen(false);

    const nextImage = () =>
        setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
    const prevImage = () =>
        setCurrentImageIndex(
            (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
        );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-emerald-500 rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 font-semibold">
                {error || "Failed to load announcements."}
            </div>
        );
    }

    if (!announcements.length) {
        return (
            <div className="p-8 text-center text-gray-600">
                <MegaphoneIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p>No announcements yet.</p>
            </div>
        );
    }

    return (
        <>
            {lightboxOpen && (
                <ImageLightbox
                    images={selectedImages}
                    currentIndex={currentImageIndex}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}

            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {announcements.map((announcement) => (
                    <div
                        key={announcement.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-5 sm:p-6"
                    >
                        {/* Header Section (like Facebook Post) */}
                        <div className="flex items-start gap-3 mb-4">
                            {/* Profile Picture */}
                            <img
                                src={
                                    announcement.landlord?.profilePicture ||
                                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                }
                                alt="Landlord"
                                className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">
                                    {announcement.landlord
                                        ? `${announcement.landlord.firstName} ${announcement.landlord.lastName}`
                                        : "Landlord"}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {announcement.property_name && (
                                        <span className="font-medium text-emerald-600">
                      {announcement.property_name}
                    </span>
                                    )}{" "}
                                    • {formatDate(announcement.created_at)}
                                </p>
                            </div>

                            {/* Icon */}
                            <MegaphoneIcon className="w-5 h-5 text-emerald-500 mt-1" />
                        </div>

                        {/* Content */}
                        <div className="ml-14">
                            {/* Subject */}
                            <h3 className="font-bold text-gray-900 text-base mb-1">
                                {announcement.subject}
                            </h3>
                            {/* Description */}
                            <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
                                {announcement.description}
                            </p>

                            {/* Images */}
                            {announcement.photos && announcement.photos.length > 0 && (
                                <div
                                    className={`grid gap-2 ${
                                        announcement.photos.length === 1
                                            ? "grid-cols-1"
                                            : "grid-cols-2"
                                    }`}
                                >
                                    {announcement.photos.slice(0, 4).map((photo, index) => (
                                        <button
                                            key={index}
                                            onClick={() => openLightbox(announcement.photos!, index)}
                                            className="relative overflow-hidden rounded-lg group"
                                        >
                                            <img
                                                src={photo}
                                                alt={`Announcement ${index + 1}`}
                                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {index === 3 &&
                                                announcement.photos.length > 4 && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                                                        +{announcement.photos.length - 4}
                                                    </div>
                                                )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
