import Image from "next/image";
import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaRuler,
  FaCouch,
  FaBuilding,
  FaFacebook,
  FaTwitter,
  FaLink,
  FaWhatsapp,
  FaShieldAlt,
  FaShareAlt,
  FaTimes,
  FaBed,
} from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md";
import { BsImageAlt } from "react-icons/bs";
import { HiStar } from "react-icons/hi";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation } from "./utils";

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const BASE_URL = "https://rent-alley-web.vercel.app";

  const formatUnitStyle = (style: string) => {
    if (!style) return null;
    return style
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
        showToast("✅ Link copied!");
        setIsModalOpen(false);
        return;
    }

    window.open(finalUrl, "_blank", "width=600,height=400");
  };

  const showToast = (message: string) => {
    // Check if we're in the browser
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const existing = document.querySelector(".share-toast");
    existing?.remove();

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className =
      "share-toast fixed top-20 right-4 px-4 py-2 rounded-lg shadow-lg z-[9999] text-sm font-medium bg-gray-900 text-white";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <article
        onClick={onClick}
        className="group relative bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl border border-gray-200 hover:border-gray-300 flex flex-col h-full"
      >
        {/* Image Container */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100">
          {unit.photos?.[0] && !imageError ? (
            <Image
              src={unit.photos[0]}
              alt={`${unit.property_name} - Unit ${unit.unit_name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <BsImageAlt className="text-4xl text-gray-300" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Right Actions */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <button
              onClick={handleShareClick}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all hover:scale-110 active:scale-95 shadow-sm"
              aria-label="Share"
            >
              <FaShareAlt className="w-3.5 h-3.5 text-gray-700" />
            </button>
          </div>

          {/* Top Left Badge */}
          {unit.unit_style && (
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm">
                <FaBed className="w-3 h-3 text-gray-700" />
                <span className="text-xs font-semibold text-gray-900">
                  {formatUnitStyle(unit.unit_style)}
                </span>
              </div>
            </div>
          )}

          {/* Verified Badge */}
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500 rounded-lg shadow-md">
              <MdVerifiedUser className="w-3 h-3 text-white" />
              <span className="text-xs font-semibold text-white">Verified</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Location */}
          <div className="flex items-start gap-2 mb-2">
            <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-1">
              {formatLocation(unit.city, unit.province)}
            </p>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {unit.unit_name}
          </h3>

          {/* Unit Name & Property Type */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">{unit.property_name}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-500 capitalize">
              {unit.property_type.replace(/_/g, " ")}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-3" />

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FaRuler className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-semibold text-gray-900">
                  {unit.unit_size} sqm
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <FaCouch className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Furnishing</p>
                <p className="text-xs font-semibold text-gray-900 capitalize line-clamp-1">
                  {unit.furnish.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Price & CTA */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(Number(unit.rent_amount))}
                </p>
                <p className="text-xs text-gray-500">per month</p>
              </div>
              <button
                onClick={onClick}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Hover Border Effect */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-emerald-400/30 transition-colors duration-300 pointer-events-none" />
      </article>

      {/* Share Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Share listing
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaFacebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Facebook
                  </span>
                </button>

                <button
                  onClick={() => handleShare("twitter")}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-sky-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
                    <FaTwitter className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Twitter
                  </span>
                </button>

                <button
                  onClick={() => handleShare("whatsapp")}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-green-50 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={() => handleShare("link")}
                  className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                    <FaLink className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    Copy
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
