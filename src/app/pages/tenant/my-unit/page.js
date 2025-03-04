"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import {
  HomeIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function MyUnit() {
  const { user } = useAuth();
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [landlord_id, setLandlordId] = useState(null);
  const [isSecurityPaid, setIsSecurityPaid] = useState(false);
  const [isAdvancedPaid, setIsAdvancedPaid] = useState(false);

  // useEffect(() => {
  //   const fetchUnitData = async () => {
  //     try {
  //       const { data } = await axios.get(
  //         `/api/tenant/approved-tenant-property?tenantId=${user.tenant_id}`
  //       );
  //       setUnit(data[0]);
  //       setLandlordId(data.landlord_id);
  //       console.log("Landlord ID: ", data.landlord_id);
  //
  //     } catch (err) {
  //       setError(err.response?.data?.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchUnitData();
  // }, [user, landlord_id]);

  useEffect(() => {
    const fetchUnitData = async () => {
      try {
        const { data } = await axios.get(
          `/api/tenant/approved-tenant-property?tenantId=${user.tenant_id}`
        );

        console.log("Fetched unit data:", data);

        if (data) {
          setUnit(data[0]);
          setLandlordId(data[0].landlord_id);
          console.log(setLandlordId(data[0].landlord_id));
        }
      } catch (err) {
        setError(err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitData();
  }, [user]);

  // Handle Pay Security Deposit here
  const handleSecurityPayment = async () => {
    const result = await Swal.fire({
      title: "Pay Security Deposit?",
      text: "Are you sure you want to proceed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setLoadingPayment(true);

      setTimeout(() => {
        setLoadingPayment(false);
        setIsSecurityPaid(true);
        Swal.fire("Payment Successful", "Security deposit paid.", "success");
      }, 1000);
    }
  };

  //Handle Advanced Payment here
  const handleAdvancedPayment = async () => {
    const result = await Swal.fire({
      title: "Pay Advanced Rent?",
      text: "Are you sure you want to proceed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setLoadingPayment(true);

      setTimeout(() => {
        setLoadingPayment(false);
        setIsAdvancedPaid(true);
        Swal.fire("Payment Successful", "Advanced rent paid.", "success");
      }, 1000);
    }
  };

  // Handle Access Rent Portal here
  const handleAccessRentPortal = () => {
    router.push("/pages/tenant/dashboard");
  };

  // Check required payments
  const requiresSecurity = unit?.sec_deposit > 0;
  const requiresAdvanced = unit?.advanced_payment > 0;
  const allPaymentsMade =
    (!requiresSecurity || isSecurityPaid) &&
    (!requiresAdvanced || isAdvancedPaid);

  const renderAmenities = (amenitiesData) => {
    let amenities = [];

    try {
      if (typeof amenitiesData === "string") {
        // Check if it's a valid JSON array (i.e., starts with "[" and ends with "]")
        if (
          amenitiesData.trim().startsWith("[") &&
          amenitiesData.trim().endsWith("]")
        ) {
          amenities = JSON.parse(amenitiesData);
        } else {
          // If it's a comma-separated string, split into an array
          amenities = amenitiesData.split(",").map((item) => item.trim());
        }
      } else if (Array.isArray(amenitiesData)) {
        amenities = amenitiesData;
      }
    } catch (e) {
      console.error("Error parsing amenities:", e);
      return [];
    }

    return amenities;
  };

  // Format address from individual fields
  const formatAddress = (unit) => {
    if (!unit) return "";
    return `${unit.street || ""}, ${unit.city || ""}, ${
      unit.province
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || ""
    } ${unit.zip_code || ""}`.trim();
  };

  const handleContactLandlord = () => {
    if (!landlord_id) {
      console.error("Missing landlord_id!");
      return;
    }
    const chatRoom = `chat_${[user?.user_id, landlord_id].sort().join("_")}`;

    router.push(
      `/pages/commons/chat?chat_room=${chatRoom}&landlord_id=${landlord_id}`
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="hidden w-64 border-r border-gray-200 bg-white py-6 px-6 md:block">
        {/* <div className="mb-8 flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <UserCircleIcon className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-indigo-900">
              My Account
            </h2>
          </div>
        </div> */}
        <nav>
          <ul className="space-y-3">
            <li className="rounded-md bg-indigo-50">
              <a
                href="#"
                className="flex items-center space-x-3 rounded-md p-3 font-medium text-indigo-900"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Current Unit</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center space-x-3 rounded-md p-3 text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              >
                <ClockIcon className="h-5 w-5" />
                <span>Unit History</span>
              </a>
            </li>
            {/* <li>
              <a
                href="#"
                className="flex items-center space-x-3 rounded-md p-3 text-gray-700 transition-colors duration-200 hover:bg-gray-100"
              >
                <CurrencyDollarIcon className="h-5 w-5" />
                <span>Payment History</span>
              </a>
            </li> */}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header with Menu Toggle */}
        <div className="bg-white shadow-sm md:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <HomeIcon className="mr-2 h-6 w-6 text-indigo-900" />
              <div>
                <h1 className="text-xl font-bold text-indigo-900">My Unit</h1>
              </div>
            </div>
            <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden bg-white shadow-sm md:block">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <HomeIcon className="mr-3 h-7 w-7 text-indigo-900" />
              <h1 className="text-2xl font-bold text-indigo-900">
                Current Unit
              </h1>
            </div>
          </div>
        </div>

        {/* Unit Details */}
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
          {unit && (
            <div className="overflow-hidden rounded-lg bg-white shadow-lg">
              <div className="md:flex">
                {/* Left: Unit Image */}
                <div className="relative h-64 md:h-auto md:w-1/2">
                  <Image
                    src={unit.unit_photo || "/images/apt-img.jpg"}
                    alt={unit?.unit_name || "Unit Image"}
                    layout="fill"
                    objectFit="cover"
                    className="h-full w-full"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                      {unit?.property_type?.charAt(0).toUpperCase() +
                        unit?.property_type?.slice(1) || "Residential"}
                    </span>
                  </div>
                </div>

                {/* Right: Unit Details */}
                <div className="p-6 md:w-1/2">
                  <div className="mb-6">
                    <h2 className="mb-2 text-2xl font-bold text-gray-800">
                      {unit.property_name} - Unit {unit.unit_name}
                    </h2>

                    <div className="mb-4 flex items-center text-sm text-gray-600">
                      <InformationCircleIcon className="mr-1 h-4 w-4" />
                      <span>{formatAddress(unit)}</span>
                    </div>

                    <p className="mb-6 line-clamp-4 text-gray-600">
                      {unit.description || "No description available"}
                    </p>

                    <div className="mb-8 flex items-center">
                      <BuildingOfficeIcon className="mr-2 h-5 w-5 text-indigo-700" />
                      <span className="font-medium text-indigo-700">
                        Individual Unit
                      </span>
                    </div>
                  </div>

                  <div className="mb-8 space-y-4">
                    {unit?.rent_amount && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Monthly Rent:
                        </span>
                        <span className="text-lg font-bold">
                          ₱{parseFloat(unit?.rent_amount).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {unit?.status && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          {unit?.status.charAt(0).toUpperCase() +
                            unit?.status.slice(1) || "Current"}
                        </span>
                      </div>
                    )}

                    {unit?.unit_size && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Unit Size:
                        </span>
                        <span className="text-gray-900">
                          {unit?.unit_size} sqm
                        </span>
                      </div>
                    )}

                    {unit?.furnish && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Furnish Type:
                        </span>
                        <span className="capitalize text-gray-900">
                          {unit?.furnish
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {requiresSecurity && !isSecurityPaid && (
                      <button
                        onClick={handleSecurityPayment}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                        Pay Security Deposit
                      </button>
                    )}

                    {requiresAdvanced && !isAdvancedPaid && (
                      <button
                        onClick={handleAdvancedPayment}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-indigo-700"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                        Pay Advanced Rent
                      </button>
                    )}

                    {allPaymentsMade && (
                      <button
                        onClick={handleAccessRentPortal}
                        className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-green-700"
                      >
                        Access Rent Portal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              {unit.amenities && (
                <div className="border-t border-gray-200 px-6 py-6">
                  <h3 className="mb-4 text-lg font-semibold">
                    Amenities & Inclusions
                  </h3>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {renderAmenities(unit.amenities).map((amenity, index) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-700"
                      >
                        <CheckCircleIcon className="mr-2 h-5 w-5 text-green-600" />
                        {amenity}
                      </li>
                    ))}
                    {renderAmenities(unit.amenities).length === 0 && (
                      <li className="italic text-gray-500">
                        No amenities information available
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Quick Actions Section */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleContactLandlord}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    Contact Landlord
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center">
    Loading...
  </div>
);

const ErrorScreen = ({ error }) => (
  <div className="flex min-h-screen items-center justify-center text-red-500">
    <XCircleIcon className="h-8 w-8 mr-2" />
    {error}
  </div>
);
