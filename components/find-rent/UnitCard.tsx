"use client";
import Image from "next/image";
import { useState, useCallback } from "react";
import {
  MapPin,
  Ruler,
  Sofa,
  Share2,
  X,
  Bed,
  BadgeCheck,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Link2,
  Heart,
} from "lucide-react";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation } from "./utils";

// Social icons as simple SVGs for consistency
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const BASE_URL = "https://rent-alley-web.vercel.app";
  const images = unit.photos?.length > 0 ? unit.photos : [];
  const hasMultipleImages = images.length > 1;

  const formatUnitStyle = (style: string) => {
    if (!style) return null;
    return style
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const showToast = useCallback((message: string) => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const existing = document.querySelector(".share-toast");
    existing?.remove();

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className =
      "share-toast fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg z-[9999] text-sm font-medium bg-gray-900 text-white animate-in fade-in slide-in-from-top-2 duration-200";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("animate-out", "fade-out", "slide-out-to-top-2");
      setTimeout(() => toast.remove(), 150);
    }, 2000);
  }, []);

  const handleShare = async (platform: string) => {
    const shareUrl = `${BASE_URL}/pages/find-rent/${unit.property_id}/${unit.unit_id}`;
    const shareText = `Check out this ${
      formatUnitStyle(unit.unit_style) || "unit"
    } for rent! 🏠\n\n${unit.property_name} - Unit ${
      unit.unit_name
    }\n💰 ${formatCurrency(
      Number(unit.rent_amount)
    )}/month\n📍 ${formatLocation(unit.city, unit.province)}`;

    let finalUrl = "";

    switch (platform) {
      case "facebook":
        finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "twitter":
        finalUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "whatsapp":
        finalUrl = `https://wa.me/?text=${encodeURIComponent(
          shareText + `\n\n${shareUrl}`
        )}`;
        break;
      case "link":
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!");
        setIsShareModalOpen(false);
        return;
    }

    window.open(finalUrl, "_blank", "width=600,height=400");
    setIsShareModalOpen(false);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    showToast(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <article
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl border border-gray-200 hover:border-emerald-200 flex flex-col h-full"
      >
        {/* Image Container */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
          {images.length > 0 && !imageError ? (
            <Image
              src={images[currentImageIndex]}
              alt={`${unit.property_name} - Unit ${unit.unit_name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-500 ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image Navigation Arrows */}
          {hasMultipleImages && isHovered && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Dots Indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full">
              {images.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`rounded-full transition-all ${
                    currentImageIndex === index
                      ? "w-2 h-2 bg-white"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
              {images.length > 5 && (
                <span className="text-[10px] text-white/70 ml-0.5">
                  +{images.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Top Right Actions */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
            <button
              onClick={handleFavoriteClick}
              className={`p-2 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 ${
                isFavorite
                  ? "bg-red-500 text-white"
                  : "bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
              }`}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
              />
            </button>
            <button
              onClick={handleShareClick}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all hover:scale-110 active:scale-95 shadow-sm"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Top Left - Unit Style Badge */}
          {unit.unit_style && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                <Bed className="w-3.5 h-3.5 text-gray-700" />
                <span className="text-xs font-semibold text-gray-900">
                  {formatUnitStyle(unit.unit_style)}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Left - Verified Badge */}
          <div className="absolute bottom-2.5 left-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg shadow-md">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white">Verified</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Location */}
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-500 line-clamp-1">
              {formatLocation(unit.city, unit.province)}
            </p>
          </div>

          {/* Unit Name as Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {unit.unit_name}
          </h3>

          {/* Property Name & Type */}
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <span className="line-clamp-1">{unit.property_name}</span>
            <span className="text-gray-300">•</span>
            <span className="capitalize flex-shrink-0">
              {unit.property_type.replace(/_/g, " ")}
            </span>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2.5 p-2.5 bg-blue-50/70 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Ruler className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Size
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {unit.unit_size} sqm
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Sofa className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Furnish
                </p>
                <p className="text-sm font-bold text-gray-900 capitalize truncate">
                  {unit.furnish.replace(/_/g, " ").replace("furnished", "")}
                </p>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Price & CTA */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(Number(unit.rent_amount))}
                </p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Hover Border Glow */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-emerald-400/20 transition-all duration-300 pointer-events-none" />
      </article>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Share Listing
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Share this property with others
                </p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Share Options */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3">
                {/* Facebook */}
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex flex-col items-center gap-2.5 p-3 hover:bg-blue-50 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                    <FacebookIcon />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    Facebook
                  </span>
                </button>

                {/* Twitter/X */}
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex flex-col items-center gap-2.5 p-3 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-gray-500/20">
                    <TwitterIcon />
                  </div>
                  <span className="text-xs font-medium text-gray-600">X</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleShare("whatsapp")}
                  className="flex flex-col items-center gap-2.5 p-3 hover:bg-green-50 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                    <WhatsAppIcon />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    WhatsApp
                  </span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={() => handleShare("link")}
                  className="flex flex-col items-center gap-2.5 p-3 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-gray-500/20">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    Copy
                  </span>
                </button>
              </div>
            </div>

            {/* Preview Card */}
            <div className="mx-5 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {unit.photos?.[0] ? (
                    <Image
                      src={unit.photos[0]}
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {unit.unit_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {unit.property_name}
                  </p>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(Number(unit.rent_amount))}/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
