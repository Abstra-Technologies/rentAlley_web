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
  FaCheckCircle,
  FaHeart,
  FaShareAlt,
  FaTimes,
} from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md"; // Import MdVerifiedUser
import { BsImageAlt } from "react-icons/bs";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation } from "./utils";

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const BASE_URL = "https://rent-alley-web.vercel.app";

  const getOgImageUrl = () => {
    const firstPhoto = unit.photos?.[0] || "";
    const encodedTitle = encodeURIComponent(unit.property_name);
    const encodedUnit = encodeURIComponent(unit.unit_name);
    const rent = encodeURIComponent(formatCurrency(Number(unit.rent_amount)));

    return `${BASE_URL}/api/og?unit=${encodedUnit}&property=${encodedTitle}&rent=${rent}&image=${encodeURIComponent(
      firstPhoto
    )}`;
  };

  const handleShare = async (platform: string) => {
    const shareUrl = `${BASE_URL}/pages/find-rent/${unit.property_id}/${unit.unit_id}`;
    const shareText = `Check this unit for rent! 🏠 Unit ${unit.unit_name} at ${
      unit.property_name
    }\n💰 ${formatCurrency(
      Number(unit.rent_amount)
    )}/month\n📍 ${formatLocation(
      unit.city,
      unit.province
    )}\n\n#Upkyp #ConnectMoreManageLess\n\n`;

    const ogImage = getOgImageUrl();

    try {
      await fetch(ogImage, { cache: "no-cache" });
    } catch (error) {
      console.warn("OG Image prefetch failed");
    }

    let finalUrl = "";

    switch (platform) {
      case "facebook":
        finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}&quote=${encodeURIComponent(shareText)}`;
        break;

      case "twitter":
      case "x":
        finalUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;

      case "whatsapp":
        finalUrl = `https://wa.me/?text=${encodeURIComponent(
          shareText + `\n\n👉 ${shareUrl}`
        )}`;
        break;

      case "link":
        await navigator.clipboard.writeText(shareUrl);
        showToast("✅ Link copied to clipboard!");
        setIsModalOpen(false); // Close modal on copy
        return;
    }

    window.open(finalUrl, "_blank", "width=600,height=400,noopener,noreferrer");
  };

  const showToast = (message: string) => {
    const existing = document.querySelector(".share-toast");
    existing?.remove();

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `share-toast fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl z-50 font-medium ${
      message.includes("✅")
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
        : "bg-gradient-to-r from-red-500 to-red-600 text-white"
    }`;
    toast.style.animation = "slideInRight 0.3s ease-out";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Toggled favorite for unit:", unit.unit_id);
    // Add your favorite/shortlist logic here
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <article
        onClick={onClick}
        className="group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 ease-out cursor-pointer hover:shadow-2xl hover:shadow-emerald-100/50"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {unit.photos?.[0] ? (
            <Image
              src={unit.photos[0]}
              alt={`Unit ${unit.unit_name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BsImageAlt className="text-5xl text-slate-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* --- NEW: Icon Buttons (Favorite, Share & Verified Badge) --- */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Verified Badge */}
            {/* You might want to conditionally render this badge based on unit.is_verified or similar */}
            <div
              className="backdrop-blur-lg bg-gradient-to-br from-blue-600 to-emerald-600 p-2.5 rounded-full shadow-2xl border-2 border-white/30 group-hover:scale-110 transition-all duration-300"
              title="Verified & Safe Property"
            >
              <MdVerifiedUser className="text-white text-xl drop-shadow-lg" />
            </div>
            {/* Share Button */}
            <button
              onClick={handleShareClick}
              className="p-2.5 backdrop-blur-md bg-white/20 rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Share listing"
              title="Share listing"
            >
              <FaShareAlt className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4">
            <div className="backdrop-blur-lg bg-white/10 border border-white/30 rounded-2xl px-4 py-3 shadow-2xl">
              <p className="font-bold text-2xl sm:text-3xl text-white drop-shadow-lg">
                {formatCurrency(Number(unit.rent_amount))}
              </p>
              <p className="text-xs text-white/90 font-medium">/month</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="font-extrabold text-gray-900 text-xl sm:text-2xl truncate mb-1">
              Unit {unit.unit_name}
            </h3>
            <div className="flex items-center gap-2 text-gray-600">
              <FaMapMarkerAlt className="text-emerald-500 text-sm flex-shrink-0" />
              <p className="text-sm truncate font-medium">
                {formatLocation(unit.city, unit.province)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5 text-gray-700 border-y border-gray-100 py-4">
            <div className="flex items-center gap-2">
              <FaRuler className="text-blue-500 text-lg flex-shrink-0" />
              <span className="text-sm font-semibold">
                {unit.unit_size} sqm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaCouch className="text-blue-500 text-lg flex-shrink-0" />
              <span className="text-sm font-semibold capitalize truncate">
                {unit.furnish.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
              <FaBuilding className="text-emerald-600 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-700 text-sm truncate">
                  {unit.property_name}
                </p>
                <FaCheckCircle
                  className="text-blue-500 flex-shrink-0 text-xs"
                  title="Verified Property"
                />
              </div>
              <p className="text-xs text-gray-500 capitalize font-medium">
                {unit.property_type.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div className="mb-5 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2">
              <FaShieldAlt className="text-blue-600 text-sm flex-shrink-0" />
              <p className="text-xs text-gray-700 font-medium">
                <span className="font-bold text-blue-600">Verified Safe</span> ·
                Background checked property
              </p>
            </div>
          </div>

          <button className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]">
            <span className="flex items-center justify-center gap-2">
              View Details
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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
            </span>
          </button>
        </div>

        <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-emerald-200/50 transition-all duration-500 pointer-events-none" />
      </article>

      {/* --- Share Modal --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out"
          ></div>

          {/* Modal Panel */}
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-out scale-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                Share this listing
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-600 mb-5">
                Know someone who might like this? Share it with them!
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 font-medium transition-all hover:scale-105"
                >
                  <FaFacebook className="w-6 h-6" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={() => handleShare("twitter")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-600 font-medium transition-all hover:scale-105"
                >
                  <FaTwitter className="w-6 h-6" />
                  <span>Twitter</span>
                </button>

                <button
                  onClick={() => handleShare("whatsapp")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl text-green-600 font-medium transition-all hover:scale-105"
                >
                  <FaWhatsapp className="w-6 h-6" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShare("link")}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 font-medium transition-all hover:scale-105"
                >
                  <FaLink className="w-6 h-6" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
