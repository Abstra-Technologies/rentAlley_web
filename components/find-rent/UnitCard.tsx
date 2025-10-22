import Image from "next/image";
import {
  FaMapMarkerAlt,
  FaRuler,
  FaCouch,
  FaBed,
  FaBuilding,
  FaFacebook,
  FaTwitter,
  FaLink,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified } from "react-icons/md";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation } from "./utils";

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  const BASE_URL = "https://rent-alley-web.vercel.app";

  const getOgImageUrl = () => {
    const firstPhoto = unit.photos?.[0] || "";
    const encodedTitle = encodeURIComponent(unit.property_name);
    const encodedUnit = encodeURIComponent(unit.unit_name);
    const rent = encodeURIComponent(formatCurrency(Number(unit.rent_amount)));

    return `${BASE_URL}/api/og?unit=${encodedUnit}&property=${encodedTitle}&rent=${rent}&image=${encodeURIComponent(firstPhoto)}`;
  };

  console.log('ot image', getOgImageUrl());

  const handleShare = async (platform: string) => {
    const shareUrl = `${BASE_URL}/pages/find-rent/${unit.property_id}/${unit.unit_id}`;
    const firstPhoto = unit.photos?.[0] || "";
    const ogImage = getOgImageUrl();

    // ✅ PERFECT COMMENT + HASHTAGS
    const shareText = `Check this  unit for rent! 🏠 Unit ${unit.unit_name} at ${unit.property_name}\n💰 ${formatCurrency(Number(unit.rent_amount))}/month\n📍 ${formatLocation(unit.city, unit.province)}\n\n#Upkyp #ConnectMoreManageLess \n\n`;

    console.log('🔗 Sharing:', { shareUrl, firstPhoto, ogImage, shareText });

    // ✅ PREFETCH OG IMAGE
    try {
      await fetch(ogImage, { cache: 'no-cache' });
    } catch (error) {
      console.warn('OG Image prefetch failed');
    }

    let finalUrl = "";

    switch (platform) {
      case "facebook":
        finalUrl = `https://www.facebook.com/sharer/sharer.php?` +
            `u=${encodeURIComponent(shareUrl)}&` +
            `quote=${encodeURIComponent(shareText)}`;
        break;

      case "twitter":
      case "x":
        finalUrl = `https://twitter.com/intent/tweet?` +
            `text=${encodeURIComponent(shareText)}&` +
            `url=${encodeURIComponent(shareUrl)}`;
        break;

      case "whatsapp":
        finalUrl = `https://wa.me/?text=${encodeURIComponent(shareText + `\n\n👉 ${shareUrl}`)}`;
        break;

      case "link":
        await navigator.clipboard.writeText(shareUrl);
        showToast('✅ Link copied!');
        return;
    }

    window.open(finalUrl, "_blank", "width=600,height=400,noopener,noreferrer");
  };
// ✅ Better toast function
  const showToast = (message: string) => {
    // Remove existing toast
    const existing = document.querySelector('.share-toast');
    existing?.remove();

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `share-toast fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right-2 fade-in duration-200 ${
        message.includes('✅') ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    }`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };
  return (
      <article
          onClick={onClick}
          className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-emerald-200 transform hover:-translate-y-1"
      >
        {/* Image Container - SAME AS BEFORE */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-emerald-50">
          {unit.photos?.[0] ? (
              <Image
                  src={unit.photos[0]}
                  alt={`Unit ${unit.unit_name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
          ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BsImageAlt className="text-4xl text-gray-400" />
              </div>
          )}
          {/* Rest of badges - SAME */}
          <div className="absolute top-3 left-3">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full shadow-lg backdrop-blur-sm">
              <span className="font-bold text-sm">Unit {unit.unit_name}</span>
            </div>
          </div>
          {unit.flexipay_enabled === 1 && (
              <div className="absolute top-3 right-3">
                <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                  <MdVerified />
                  <span>FlexiPay</span>
                </div>
              </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white">
              <p className="font-bold text-2xl">{formatCurrency(Number(unit.rent_amount))}</p>
              <p className="text-xs text-white/90">/month</p>
            </div>
          </div>
        </div>

        {/* Content - SAME AS BEFORE */}
        <div className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <FaBuilding className="text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-700 text-sm truncate">{unit.property_name}</h3>
              <p className="text-xs text-gray-500 capitalize">{unit.property_type.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0" />
            <p className="text-xs truncate">{formatLocation(unit.city, unit.province)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2">
              <FaRuler className="text-blue-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-700">{unit.unit_size} sqm</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2">
              <FaCouch className="text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-700 capitalize truncate">
              {unit.furnish.replace(/_/g, " ")}
            </span>
            </div>
          </div>
          <button className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform transition-all group-hover:scale-[1.02] active:scale-[0.98]">
            View Unit Details
          </button>

          {/* ✅ Enhanced Social Share - Added WhatsApp */}
          <div className="mt-3 flex justify-center gap-2 pt-2 border-t border-gray-100">
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare("facebook");
                }}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-md transition-all hover:scale-110 active:scale-95"
                title="Share on Facebook"
                aria-label="Share on Facebook"
            >
              <FaFacebook className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare("twitter");
                }}
                className="flex items-center justify-center w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-full text-white shadow-md transition-all hover:scale-110 active:scale-95"
                title="Share on X (Twitter)"
                aria-label="Share on X"
            >
              <FaTwitter className="w-5 h-5" />
            </button>
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare("whatsapp");
                }}
                className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-md transition-all hover:scale-110 active:scale-95"
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
            >
              📱
            </button>
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare("link");
                }}
                className="flex items-center justify-center w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 shadow-sm transition-all hover:scale-110 active:scale-95"
                title="Copy Link"
                aria-label="Copy link"
            >
              <FaLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </article>
  );
}