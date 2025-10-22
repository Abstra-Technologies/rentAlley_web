"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "@/components/tenant/find-rent/inquiry";
import Image from "next/image";
import useAuth from "@/hooks/useSession";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import LoadingScreen from "@/components/loadingScreen";
import { IoArrowBackOutline, IoExpand } from "react-icons/io5";
import {
    FaExclamationTriangle,
    FaInfoCircle,
    FaSwimmingPool,
    FaWifi,
    FaRuler,
    FaCouch,
    FaBed,
    FaShieldAlt,
    FaCalendarAlt,
    FaHome,
    FaMapMarkerAlt,
    FaChevronLeft,
    FaChevronRight,
    FaStar,
    FaPhone,
    FaMoneyBillWave,
    FaBuilding,
    FaMapPin,
} from "react-icons/fa";
import { BsCheckCircleFill, BsImageAlt } from "react-icons/bs";
import {
    MdVerified,
    MdOutlineApartment,
    MdClose,
    MdPayment,
} from "react-icons/md";
import { HiSparkles, HiLocationMarker } from "react-icons/hi";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { SiZcash } from "react-icons/si";
import ReviewsList from "../../../../../components/tenant/reviewList";
import { UnitDetails } from "@/types/units";
import LandlordCard from "@/components/landlord/properties/LandlordCard";
import { FaShareAlt } from "react-icons/fa";
import { Metadata } from "next";

const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false, loading: () => <MapLoadingPlaceholder /> }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);

function MapLoadingPlaceholder() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm font-medium">Loading map...</p>
            </div>
        </div>
    );
}

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
    const { user } = useAuth();
    const [unit, setUnit] = useState<UnitDetails | null>(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
    const [customIcon, setCustomIcon] = useState(null);
    const [isClient, setIsClient] = useState(false);

    const [nearbyData, setNearbyData] = useState<NearbyData>({
        summary: "",
        places: [],
    });
    const [nearbyLoading, setNearbyLoading] = useState(false);

    useEffect(() => {
        if (unit) {
            console.log("UNIT DESCRIPTION RAW VALUE:", unit.property_description);
        }
    }, [unit]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && isClient) {
            import("leaflet").then((L) => {
                const leaflet = L.default || L;
                delete leaflet.Icon.Default.prototype._getIconUrl;
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
                console.log("Merged unit data:", data);
                console.log("DESCRIPTION CHECK:", data.property_description);
                setUnit(data);
                setPhotos(data.photos || []);

                // Fetch nearby places immediately without waiting for unit state update
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

                console.log("Nearby Places Generator API Response:", data);
                setNearbyData(data);
            } catch (error) {
                console.error("Error fetching dynamic nearby places:", error);
                setNearbyData({ summary: "", places: [] });
            } finally {
                setNearbyLoading(false);
            }
        }

        fetchUnitDetails();
    }, [rentId, id]);

    const parseAmenities = (amenitiesString) => {
        if (!amenitiesString) return [];
        return amenitiesString.split(",").map((item) => item.trim());
    };

    const parsePaymentMethods = (methodsString) => {
        if (!methodsString) return [];

        if (typeof methodsString === "string") {
            const cleaned = methodsString.replace(/[\[\]"']/g, "").trim();

            if (cleaned === "") return [];

            return cleaned
                .split(/[\n,]+/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
                .map((item) => {
                    return item
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join("-")
                        .replace("G-cash", "GCash")
                        .replace("Maya", "Maya")
                        .replace("Pdc", "PDC");
                });
        }

        return [];
    };

    const getAmenityIcon = (amenity) => {
        const lowerCaseAmenity = amenity.toLowerCase();
        if (lowerCaseAmenity.includes("pool")) return <FaSwimmingPool />;
        if (
            lowerCaseAmenity.includes("wifi") ||
            lowerCaseAmenity.includes("internet")
        )
            return <FaWifi />;
        if (
            lowerCaseAmenity.includes("furniture") ||
            lowerCaseAmenity.includes("furnished")
        )
            return <FaCouch />;
        if (lowerCaseAmenity.includes("bed")) return <FaBed />;
        if (lowerCaseAmenity.includes("size") || lowerCaseAmenity.includes("space"))
            return <FaRuler />;
        if (lowerCaseAmenity.includes("security")) return <FaShieldAlt />;
        return <BsCheckCircleFill />;
    };

    const getPaymentIcon = (method) => {
        const lowerMethod = method.toLowerCase();
        if (lowerMethod.replace("-", "").includes("gcash"))
            return <SiZcash className="text-blue-600" />;
        if (lowerMethod.includes("maya"))
            return <FaMoneyBillWave className="text-emerald-600" />;
        if (lowerMethod.includes("cash"))
            return <FaMoneyBillWave className="text-green-600" />;
        if (lowerMethod.includes("bank") || lowerMethod.includes("pdc"))
            return <FaBuilding className="text-indigo-600" />;
        return <MdPayment className="text-gray-600" />;
    };

    const handleImageError = (index) => {
        setImageLoadErrors((prev) => new Set(prev).add(index));
    };

    const nextImage = () => {
        setActiveImage((prev) => (prev + 1) % photos.length);
    };

    const prevImage = () => {
        setActiveImage((prev) => (prev - 1 + photos.length) % photos.length);
    };

    if (loading) {
        return <LoadingScreen message="Loading property details..." />;
    }

    if (!unit) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4">
                <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-4xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        Unit Not Found
                    </h2>
                    <p className="text-gray-600 mb-8">
                        We couldn't find the unit you're looking for.
                    </p>
                    <button
                        onClick={() => router.push(`/pages/find-rent`)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    >
                        Back to Properties
                    </button>
                </div>
            </div>
        );
    }

    const isOccupied = unit.status === "occupied";
    const amenities = parseAmenities(unit.amenities);
    const propertyAmenities = parseAmenities(unit.property_amenities);
    const paymentMethods = parsePaymentMethods(unit.accepted_payment_methods);
    const nearbyPlaces = nearbyData.places;
    const hasValidLocation = unit.latitude && unit.longitude;

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 min-h-screen pb-20">
            {/* Enhanced Header Section */}
            <div className="w-full bg-white/90 backdrop-blur-xl shadow-md sticky top-0 z-40 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group flex-shrink-0"
                                aria-label="Go back"
                            >
                                <IoArrowBackOutline className="text-xl text-gray-600 group-hover:text-gray-900 group-hover:-translate-x-1 transition-all" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                        {unit.property_name}
                                    </h1>
                                    <MdVerified className="text-blue-500 text-xl flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                        <HiSparkles className="text-white/90" />
                                        <span>Unit {unit.unit_name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                        <HiLocationMarker className="text-emerald-500 flex-shrink-0" />
                                        <span className="truncate">
                      {unit.city},{" "}
                                            {unit.province
                                                ?.split("_")
                                                .map(
                                                    (word) => word.charAt(0).toUpperCase() + word.slice(1)
                                                )
                                                .join(" ")}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                                <div className="font-bold text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                                    ₱{unit.rent_amount?.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    per month
                                </div>
                            </div>
                            <div
                                className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm flex-shrink-0 ${
                                    isOccupied
                                        ? "bg-red-100 text-red-700 border border-red-200"
                                        : "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            isOccupied ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                                        }`}
                                    ></div>
                                    {isOccupied ? "Occupied" : "Available"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Photo Gallery */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {photos.length > 0 ? (
                    <div className="relative">
                        <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[550px] rounded-3xl overflow-hidden shadow-2xl group">
                            <Image
                                src={photos[activeImage]}
                                alt={`Unit Image ${activeImage + 1}`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={() => handleImageError(activeImage)}
                                priority
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-6 left-6 text-white">
                                    <p className="text-sm font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                                        {activeImage + 1} / {photos.length}
                                    </p>
                                </div>

                                {photos.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                                            aria-label="Previous image"
                                        >
                                            <FaChevronLeft className="text-gray-800 text-lg" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                                            aria-label="Next image"
                                        >
                                            <FaChevronRight className="text-gray-800 text-lg" />
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setIsGalleryOpen(true)}
                                    className="absolute top-4 right-4 p-3 sm:p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                                    aria-label="View fullscreen"
                                >
                                    <IoExpand className="text-gray-800 text-lg sm:text-xl" />
                                </button>
                            </div>
                        </div>

                        {photos.length > 1 && (
                            <div className="mt-4 sm:mt-6">
                                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 px-1">
                                    {photos.map((photo, index) => (
                                        <button
                                            key={index}
                                            className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden transition-all duration-300 ${
                                                activeImage === index
                                                    ? "ring-4 ring-emerald-500 scale-105 shadow-xl"
                                                    : "opacity-60 hover:opacity-100 hover:scale-105 shadow-md"
                                            }`}
                                            onClick={() => setActiveImage(index)}
                                            aria-label={`View image ${index + 1}`}
                                        >
                                            <Image
                                                src={photo}
                                                alt={`Thumbnail ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            {activeImage === index && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/40 to-transparent"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-[350px] sm:h-[450px] lg:h-[550px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-3xl shadow-inner">
                        <div className="text-center">
                            <BsImageAlt className="text-6xl sm:text-7xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-semibold text-lg">
                                No images available
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Main Content Grid */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Property Description */}
                        {unit.property_description && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaInfoCircle />
                                        <span>About This Property</span>
                                    </h2>
                                </div>
                                <div className="p-6 sm:p-8">
                                    <p className="text-gray-700 leading-relaxed text-base">
                                        {unit.property_description}
                                    </p>

                                    <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-full border border-blue-200 shadow-sm">
                                        <FaBuilding className="text-blue-600 text-lg" />
                                        <span className="font-semibold text-gray-800 capitalize">
                      {unit.property_type?.replace(/_/g, " ")}
                    </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unit Overview */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MdOutlineApartment />
                                    <span>Unit Overview</span>
                                </h2>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    {[
                                        {
                                            label: "Unit Name",
                                            value: `Unit ${unit.unit_name}`,
                                            icon: <FaHome className="text-xl" />,
                                        },
                                        {
                                            label: "Unit Size",
                                            value: `${unit.unit_size} sqm`,
                                            icon: <FaRuler className="text-xl" />,
                                        },
                                        {
                                            label: "Furnishing",
                                            value: unit.furnish
                                                ?.split("_")
                                                .map(
                                                    (word) => word.charAt(0).toUpperCase() + word.slice(1)
                                                )
                                                .join(" "),
                                            icon: <FaCouch className="text-xl" />,
                                        },
                                        {
                                            label: "Security Deposit",
                                            value: `${unit.sec_deposit} ${
                                                unit.sec_deposit === 1 ? "month" : "months"
                                            }`,
                                            icon: <FaShieldAlt className="text-xl" />,
                                        },
                                        {
                                            label: "Advanced Payment",
                                            value: `${unit.advanced_payment} ${
                                                unit.advanced_payment === 1 ? "month" : "months"
                                            }`,
                                            icon: <FaCalendarAlt className="text-xl" />,
                                        },
                                        ...(unit.min_stay
                                            ? [
                                                {
                                                    label: "Minimum Stay",
                                                    value: `${unit.min_stay} month${
                                                        unit.min_stay > 1 ? "s" : ""
                                                    }`,
                                                    icon: <FaCalendarAlt className="text-xl" />,
                                                },
                                            ]
                                            : []),
                                    ].map(
                                        (item, index) =>
                                            item && (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 border border-transparent hover:border-emerald-200"
                                                >
                                                    <div className="text-emerald-500 mt-1">
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm text-gray-500 mb-1 font-medium">
                                                            {item.label}
                                                        </h3>
                                                        <p className="text-gray-900 font-bold text-base truncate">
                                                            {item.value}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Payment Methods */}
                        {paymentMethods.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <MdPayment />
                                        <span>Payment Options</span>
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    {unit.flexipay_enabled === 1 && (
                                        <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl border-2 border-purple-200 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                                    <RiShoppingBag3Fill className="text-2xl text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                                                        FlexiPay Available
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Pay your rent in flexible installments with ease
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {paymentMethods.map((method, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-emerald-50 text-gray-800 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 group"
                                            >
                                                <div className="text-3xl group-hover:scale-110 transition-transform">
                                                    {getPaymentIcon(method)}
                                                </div>
                                                <span className="font-bold text-base">{method}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unit Amenities */}
                        {amenities.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaInfoCircle />
                                        <span>Unit Amenities</span>
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {amenities.map((amenity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 text-gray-800 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
                                            >
                                                <div className="text-emerald-600 text-lg group-hover:scale-110 transition-transform">
                                                    {getAmenityIcon(amenity)}
                                                </div>
                                                <span className="font-semibold text-sm">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Property Amenities */}
                        {propertyAmenities.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaBuilding />
                                        <span>Property Amenities</span>
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {propertyAmenities.map((amenity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 text-gray-800 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                                            >
                                                <div className="text-blue-600 text-lg group-hover:scale-110 transition-transform">
                                                    {getAmenityIcon(amenity)}
                                                </div>
                                                <span className="font-semibold text-sm">{amenity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Complete Address */}
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaMapPin />
                                    <span>Complete Address</span>
                                </h2>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="flex items-start gap-4 p-5 sm:p-6 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl border-2 border-blue-200 shadow-sm">
                                    <div className="p-3 bg-white rounded-xl shadow-sm flex-shrink-0">
                                        <HiLocationMarker className="text-blue-600 text-2xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 mb-3 text-lg">
                                            {unit.property_name}
                                        </h3>
                                        <div className="space-y-2 text-gray-700">
                                            <p className="text-sm sm:text-base">
                        <span className="font-semibold text-gray-900">
                          Street:
                        </span>{" "}
                                                {unit.street}
                                            </p>
                                            {unit.brgy_district && (
                                                <p className="text-sm sm:text-base">
                          <span className="font-semibold text-gray-900">
                            Barangay:
                          </span>{" "}
                                                    {unit.brgy_district}
                                                </p>
                                            )}
                                            <p className="text-sm sm:text-base">
                        <span className="font-semibold text-gray-900">
                          City:
                        </span>{" "}
                                                {unit.city}
                                            </p>
                                            <p className="text-sm sm:text-base">
                        <span className="font-semibold text-gray-900">
                          Province:
                        </span>{" "}
                                                {unit.province
                                                    ?.split("_")
                                                    .map(
                                                        (word) =>
                                                            word.charAt(0).toUpperCase() + word.slice(1)
                                                    )
                                                    .join(" ")}
                                            </p>
                                            {unit.zip_code && (
                                                <p className="text-sm sm:text-base">
                          <span className="font-semibold text-gray-900">
                            Zip Code:
                          </span>{" "}
                                                    {unit.zip_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nearby Places */}
                        {(nearbyPlaces.length > 0 || nearbyLoading) && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <HiLocationMarker />
                                        <span>What's Nearby?</span>
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    {nearbyLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500 mb-4"></div>
                                            <p className="text-gray-600 font-medium">
                                                Discovering nearby places...
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {nearbyData.summary && (
                                                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-emerald-50 border-l-4 border-blue-500 rounded-r-2xl shadow-sm">
                                                    <p className="text-blue-800 font-medium flex items-start gap-2 text-sm sm:text-base">
                                                        <HiSparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                                                        <span className="italic">{nearbyData.summary}</span>
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {nearbyPlaces.map((place, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-emerald-100 hover:border-emerald-300 group"
                                                    >
                                                        {place.photoUrl ? (
                                                            <img
                                                                src={place.photoUrl}
                                                                alt={place.name}
                                                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border-2 border-gray-200 group-hover:scale-105 transition-transform"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 flex items-center justify-center text-xl text-emerald-600 bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                                                                {place.type === "school" && <FaBuilding />}
                                                                {place.type === "hospital" && <FaShieldAlt />}
                                                                {place.type === "mall" && (
                                                                    <RiShoppingBag3Fill />
                                                                )}
                                                                {!["school", "hospital", "mall"].includes(
                                                                    place.type
                                                                ) && <HiLocationMarker />}
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900 truncate text-sm">
                                                                {place.name}
                                                            </p>
                                                            <p className="text-xs text-gray-600 truncate">
                                                                {place.vicinity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Map Location */}
                        {hasValidLocation && isClient && customIcon && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaMapMarkerAlt />
                                        <span>Property Location</span>
                                    </h2>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-5 mb-6 border-2 border-blue-200 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                                                <HiLocationMarker className="text-blue-600 text-xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 mb-1 truncate">
                                                    {unit.property_name}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {unit.city},{" "}
                                                    {unit.province
                                                        ?.split("_")
                                                        .map(
                                                            (word) =>
                                                                word.charAt(0).toUpperCase() + word.slice(1)
                                                        )
                                                        .join(" ")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px] rounded-2xl overflow-hidden shadow-xl border-4 border-gray-100">
                                        <MapContainer
                                            center={[Number(unit.latitude), Number(unit.longitude)]}
                                            zoom={16}
                                            scrollWheelZoom={false}
                                            style={{ height: "100%", width: "100%" }}
                                            className="z-0"
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker
                                                position={[
                                                    Number(unit.latitude),
                                                    Number(unit.longitude),
                                                ]}
                                                icon={customIcon}
                                            />
                                        </MapContainer>
                                    </div>

                                    <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-xs sm:text-sm text-amber-800 text-center font-medium flex items-center justify-center gap-2">
                                            <FaShieldAlt className="flex-shrink-0" />
                                            <span>
                        Exact location will be shared after booking confirmation
                      </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Landlord Card */}
                        <LandlordCard landlord_id={unit.landlord_id} />
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <InquiryBooking
                                tenant_id={user?.tenant_id}
                                unit_id={unit.unit_id}
                                rent_amount={unit.rent_amount}
                                landlord_id={unit.landlord_id}
                            />
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-3xl shadow-xl mt-8 overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaStar />
                            <span>Reviews & Ratings</span>
                        </h2>
                    </div>
                    <div className="p-6 sm:p-8">
                        <ReviewsList
                            unit_id={unit.unit_id}
                            landlord_id={unit.landlord_id}
                        />
                    </div>
                </div>
            </div>

            {/* Enhanced Fullscreen Gallery Modal */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-50 bg-black/97 backdrop-blur-lg flex items-center justify-center">
                    <button
                        onClick={() => setIsGalleryOpen(false)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-white z-50 group"
                        aria-label="Close gallery"
                    >
                        <MdClose className="text-2xl sm:text-3xl group-hover:rotate-90 transition-transform" />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 sm:left-6 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-white group"
                        aria-label="Previous image"
                    >
                        <FaChevronLeft className="text-xl sm:text-2xl group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto p-4 sm:p-8">
                        <Image
                            src={photos[activeImage]}
                            alt={`Fullscreen image ${activeImage + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 sm:right-6 p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all text-white group"
                        aria-label="Next image"
                    >
                        <FaChevronRight className="text-xl sm:text-2xl group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20">
            <span className="text-sm sm:text-base font-semibold">
              {activeImage + 1} / {photos.length}
            </span>
                    </div>
                </div>
            )}
        </div>
    );
}
