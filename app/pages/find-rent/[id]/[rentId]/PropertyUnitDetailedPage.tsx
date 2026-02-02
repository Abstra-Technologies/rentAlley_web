"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "@/components/tenant/find-rent/inquiry";
import Image from "next/image";
import useAuth from "@/hooks/useSession";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import LoadingScreen from "@/components/loadingScreen";
import {
  IoArrowBackOutline,
  IoExpand,
  IoClose,
  IoShareSocial,
} from "react-icons/io5";
import {
  FaExclamationTriangle,
  FaSwimmingPool,
  FaWifi,
  FaRuler,
  FaCouch,
  FaBed,
  FaShieldAlt,
  FaCalendarAlt,
  FaHome,
  FaMapMarkerAlt,
  FaStar,
  FaMoneyBillWave,
  FaBuilding,
  FaCheck,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified, MdPayment } from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { SiZcash } from "react-icons/si";
import ReviewsList from "../../../../../components/tenant/reviewList";
import { UnitDetails } from "@/types/units";
import LandlordCard from "@/components/landlord/properties/LandlordCard";
import useAuthStore from "@/zustand/authStore";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface NearbyPlace {
  name: string;
  vicinity: string;
  photoUrl: string | null;
  type: string;
}

interface NearbyData {
  summary: string;
  places: NearbyPlace[];
}

export default function PropertyUnitDetailedPage() {
  const router = useRouter();
  const { rentId, id } = useParams();
  const { user } = useAuthStore();
  const [unit, setUnit] = useState<UnitDetails | null>(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [customIcon, setCustomIcon] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [nearbyData, setNearbyData] = useState<NearbyData>({
    summary: "",
    places: [],
  });
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && isClient) {
      import("leaflet").then((L) => {
        const leaflet = L.default || L;
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const icon = leaflet.divIcon({
          html: `
            <div style="position: relative;">
              <svg width="40" height="52" viewBox="0 0 40 52">
                <defs>
                  <linearGradient id="markerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3B82F6"/>
                    <stop offset="100%" style="stop-color:#10B981"/>
                  </linearGradient>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 32 20 32s20-17 20-32c0-11.046-8.954-20-20-20z" 
                      fill="url(#markerGrad)" filter="url(#shadow)"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <circle cx="20" cy="20" r="5" fill="url(#markerGrad)"/>
              </svg>
            </div>
          `,
          className: "custom-location-marker",
          iconSize: [40, 52],
          iconAnchor: [20, 52],
          popupAnchor: [0, -52],
        });
        // @ts-ignore
          setCustomIcon(icon);
      });
    }
  }, [isClient]);

  useEffect(() => {
    if (!rentId) return;

    async function fetchUnitDetails() {
      try {
        const res = await fetch(
          `/api/properties/findRent/viewPropUnitDetails?rentId=${rentId}`
        );
        if (!res.ok) throw new Error("Failed to fetch unit details");
        const data = await res.json();
        setUnit(data);
        setPhotos(data.photos || []);

        console.log('property detaiuls data: ', data);
        console.log('property detail lanldord id: ', data.landlord_id);

        if (data?.property_id) {
          fetchNearbyPlaces(data.property_id);
        }
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchNearbyPlaces(propertyId: string) {
      setNearbyLoading(true);
      try {
        const res = await fetch(
          `/api/properties/findRent/nearbyPlaces?id=${propertyId}`
        );
        if (!res.ok) throw new Error("Failed to fetch nearby places");
        const data: NearbyData = await res.json();
        setNearbyData(data);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
        setNearbyData({ summary: "", places: [] });
      } finally {
        setNearbyLoading(false);
      }
    }

    fetchUnitDetails();
  }, [rentId, id]);

  const parseAmenities = (amenitiesString: any) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(",").map((item: string) => item.trim());
  };

    const parsePaymentMethods = (methodsString: any) => {
        if (!methodsString) return [];
        if (typeof methodsString === "string") {
            const cleaned = methodsString.replace(/[\[\]"']/g, "").trim();
            if (cleaned === "") return [];
            return cleaned
                .split(/[\n,]+/)
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string) => {
                    return item
                        .split("-")
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join("-")
                        .replace("G-cash", "GCash")
                        .replace("Maya", "Maya")
                        .replace("Pdc", "PDC");
                });
        }
        return [];
    };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("pool")) return <FaSwimmingPool className="w-5 h-5" />;
    if (lower.includes("wifi") || lower.includes("internet"))
      return <FaWifi className="w-5 h-5" />;
    if (lower.includes("furniture") || lower.includes("furnished"))
      return <FaCouch className="w-5 h-5" />;
    if (lower.includes("bed")) return <FaBed className="w-5 h-5" />;
    if (lower.includes("security")) return <FaShieldAlt className="w-5 h-5" />;
    return <FaCheck className="w-5 h-5" />;
  };

  const getPaymentIcon = (method: string) => {
    const lower = method.toLowerCase();
    if (lower.replace("-", "").includes("gcash"))
      return <SiZcash className="w-5 h-5" />;
    if (lower.includes("maya")) return <FaMoneyBillWave className="w-5 h-5" />;
    if (lower.includes("cash")) return <FaMoneyBillWave className="w-5 h-5" />;
    if (lower.includes("bank") || lower.includes("pdc"))
      return <FaBuilding className="w-5 h-5" />;
    return <MdPayment className="w-5 h-5" />;
  };

  const formatUnitStyle = (style: string) => {
    if (!style) return "Standard Unit";
    return style
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return <LoadingScreen message="Loading property details..." />;
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unit Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the property you're looking for.
          </p>
          <button
            onClick={() => router.push("/pages/find-rent")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const isOccupied = unit.status === "occupied";
  const amenities = parseAmenities(unit.amenities);
  const propertyAmenities = parseAmenities(unit.property_amenities);
  const paymentMethods = parsePaymentMethods(unit.accepted_payment_methods);
  const hasValidLocation = unit.latitude && unit.longitude;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Sticky Header with Gradient */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm sm:text-base"
            >
              <IoArrowBackOutline className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* <button className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                <IoShareSocial className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
              </button> */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  ₱{unit.rent_amount?.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">/month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery - Responsive Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {photos.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            {photos.length === 1 ? (
              // Single image - full width
              <div className="relative h-[400px] sm:h-[500px]">
                <Image
                  src={photos[0]}
                  alt="Property image"
                  fill
                  className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  priority
                  onClick={() => {
                    setActiveImage(0);
                    setIsGalleryOpen(true);
                  }}
                />
              </div>
            ) : photos.length === 2 ? (
              // Two images - side by side
              <div className="grid grid-cols-2 gap-2 h-[400px] sm:h-[500px]">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group"
                    onClick={() => {
                      setActiveImage(index);
                      setIsGalleryOpen(true);
                    }}
                  >
                    <Image
                      src={photo}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : photos.length === 3 ? (
              // Three images - one large, two stacked
              <div className="grid grid-cols-2 gap-2 h-[400px] sm:h-[500px]">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => {
                    setActiveImage(0);
                    setIsGalleryOpen(true);
                  }}
                >
                  <Image
                    src={photos[0]}
                    alt="Main property image"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="grid grid-rows-2 gap-2">
                  {photos.slice(1, 3).map((photo, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group"
                      onClick={() => {
                        setActiveImage(index + 1);
                        setIsGalleryOpen(true);
                      }}
                    >
                      <Image
                        src={photo}
                        alt={`Property image ${index + 2}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            ) : photos.length === 4 ? (
              // Four images - two rows of two
              <div className="grid grid-cols-2 gap-2 h-[400px] sm:h-[500px]">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group"
                    onClick={() => {
                      setActiveImage(index);
                      setIsGalleryOpen(true);
                    }}
                  >
                    <Image
                      src={photo}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            ) : (
              // Five or more images - original grid
              <div className="grid grid-cols-4 gap-2 h-[400px] sm:h-[500px]">
                <div
                  className="col-span-4 sm:col-span-2 row-span-2 relative cursor-pointer group"
                  onClick={() => {
                    setActiveImage(0);
                    setIsGalleryOpen(true);
                  }}
                >
                  <Image
                    src={photos[0]}
                    alt="Main property image"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {photos.slice(1, 5).map((photo, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group hidden sm:block"
                    onClick={() => {
                      setActiveImage(index + 1);
                      setIsGalleryOpen(true);
                    }}
                  >
                    <Image
                      src={photo}
                      alt={`Property image ${index + 2}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {index === 3 && photos.length > 5 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-semibold text-lg">
                          +{photos.length - 5} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* View all photos button */}
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="absolute bottom-4 left-4 px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold hover:bg-white group"
            >
              <IoExpand className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>View all {photos.length} photos</span>
            </button>
          </div>
        ) : (
          <div className="h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <BsImageAlt className="w-16 h-16 text-gray-300" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Section */}
            <div className="pb-6 border-b border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {unit.unit_style && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
                        <FaBed className="w-3.5 h-3.5" />
                        {formatUnitStyle(unit.unit_style)}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                        isOccupied
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isOccupied
                            ? "bg-red-500 animate-pulse"
                            : "bg-green-500 animate-pulse"
                        }`}
                      />
                      {isOccupied ? "Occupied" : "Available"}
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Unit {unit.unit_name}
                  </h1>

                  <p className="text-lg text-gray-600 mb-3">
                    {unit.property_name}
                  </p>

                  <div className="flex items-center gap-2 text-gray-600">
                    <MdVerified className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">
                      Verified Property
                    </span>
                  </div>
                </div>

                <div className="text-right sm:hidden">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    ₱{unit.rent_amount?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  {unit.city},{" "}
                  {unit.province
                    ?.split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </span>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <FaRuler className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {unit.unit_size}
                </div>
                <div className="text-xs text-gray-500">sqm</div>
              </div>

              <div className="text-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <FaCouch className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900 capitalize">
                  {unit.furnish?.replace(/_/g, " ")}
                </div>
                <div className="text-xs text-gray-500">Furnishing</div>
              </div>

              <div className="text-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <FaShieldAlt className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {unit.sec_deposit}
                </div>
                <div className="text-xs text-gray-500">
                  month{unit.sec_deposit > 1 ? "s" : ""} deposit
                </div>
              </div>

              <div className="text-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <FaCalendarAlt className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {unit.advanced_payment}
                </div>
                <div className="text-xs text-gray-500">
                  month{unit.advanced_payment > 1 ? "s" : ""} advance
                </div>
              </div>
            </div>

            {/* Description */}
            {unit.property_description && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaHome className="w-5 h-5 text-blue-600" />
                  About this property
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {unit.property_description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <FaBuilding className="w-4 h-4 text-blue-600" />
                  <span className="capitalize font-medium">
                    {unit.property_type?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}

            {/* What this place offers */}
            {(amenities.length > 0 || propertyAmenities.length > 0) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  What this place offers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...amenities, ...propertyAmenities].map(
                    (amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 border border-transparent hover:border-blue-100"
                      >
                        <div className="text-blue-600">
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {amenity}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Payment options
                </h2>

                {unit.flexipay_enabled === 1 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center gap-3">
                    <RiShoppingBag3Fill className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        FlexiPay Available
                      </div>
                      <div className="text-sm text-gray-600">
                        Pay in flexible installments
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="text-blue-600">
                        {getPaymentIcon(method)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {method}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="w-5 h-5 text-blue-600" />
                Where you'll be
              </h2>

              <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">
                  {unit.property_name}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{unit.street}</p>
                  {unit.brgy_district && <p>{unit.brgy_district}</p>}
                  <p>
                    {unit.city},{" "}
                    {unit.province
                      ?.split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </p>
                  {unit.zip_code && <p>{unit.zip_code}</p>}
                </div>
              </div>

              {hasValidLocation && isClient && customIcon && (
                <div className="w-full h-[350px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg relative z-0">
                  <MapContainer
                    center={[Number(unit.latitude), Number(unit.longitude)]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%", zIndex: 0 }}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[Number(unit.latitude), Number(unit.longitude)]}
                      icon={customIcon}
                    />
                  </MapContainer>
                </div>
              )}
            </div>

            {/* Nearby Places */}
            {(nearbyData.places.length > 0 || nearbyLoading) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5 text-emerald-600" />
                  Explore the area
                </h2>

                {nearbyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {nearbyData.summary && (
                      <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg">
                        {nearbyData.summary}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nearbyData.places.map((place, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl hover:shadow-md transition-all border border-gray-200 hover:border-emerald-300"
                        >
                          {place.photoUrl ? (
                            <img
                              src={place.photoUrl}
                              alt={place.name}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <HiLocationMarker className="w-6 h-6 text-emerald-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {place.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {place.vicinity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaStar className="w-5 h-5 text-yellow-400" />
                Reviews
              </h2>
              <ReviewsList
                unit_id={unit.unit_id}
                landlord_id={unit.landlord_id}
              />
            </div>

            {/* Landlord */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Hosted by
              </h2>
              <LandlordCard landlord_id={unit?.landlord_id} />
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <InquiryBooking
                tenant_id={user?.tenant_id}
                unit_id={unit?.unit_id}
                rent_amount={unit?.rent_amount}
                landlord_id={unit?.landlord_id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[60] bg-black">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white z-10 backdrop-blur-sm transition-all"
          >
            <IoClose className="w-6 h-6" />
          </button>

          <div className="h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
              <Image
                src={photos[activeImage]}
                alt={`Image ${activeImage + 1}`}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-900 font-semibold shadow-lg">
            {activeImage + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === 0 ? photos.length - 1 : prev - 1
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
              >
                ←
              </button>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === photos.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
