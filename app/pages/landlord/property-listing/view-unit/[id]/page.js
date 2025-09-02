"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import {
  BuildingOffice2Icon,
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../../../../../zustand/authStore";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import PropertyDocumentsTab from "../../../../../../components/landlord//properties/PropertyDocumentsTab";
import FBShareButton from "../../../../../../components/landlord/properties/shareToFacebook";

const fetcher = (url) => axios.get(url).then((res) => res.data);

const ViewUnitPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const landlord_id = user?.landlord_id;
  const [isNavigating, setIsNavigating] = useState(false);
  const [billingMode, setBillingMode] = useState(false);
  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityTotal: "",
    electricityRate: "",
    waterTotal: "",
    waterRate: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);
  const [unitBillingStatus, setUnitBillingStatus] = useState({});
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("units");

  // Billing Status
  useEffect(() => {
    if (!id) return;
    async function fetchBillingData_PropertyUtility() {
      try {
        const response = await axios.get(
          `/api/landlord/billing/checkPropertyBillingStats`,
          {
            params: { id },
          }
        );

        if (response.data.billingData && response.data.billingData.length > 0) {
          setBillingData(response.data.billingData);
          setHasBillingForMonth(true);
          setBillingForm({
            billingPeriod: response.data.billingData[0]?.billing_period || "",
            electricityTotal:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.total_billed_amount || "",
            electricityRate:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.rate_consumed || "",
            waterTotal:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.total_billed_amount || "",
            waterRate:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.rate_consumed || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (error) {
        console.error(
          "Failed to fetch billing data:",
          error.response?.data || error.message
        );
      }
    }
    fetchBillingData_PropertyUtility();
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  const handleSaveOrUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const url = hasBillingForMonth
        ? "/api/landlord/billing/updateConcessionaireBilling"
        : "/api/landlord/billing/savePropertyUtilityBillingMonthly";

      const response = await axios({
        method: hasBillingForMonth ? "PUT" : "POST",
        url: url,
        data: {
          id,
          ...billingForm,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: hasBillingForMonth
          ? "Billing information updated successfully."
          : "Billing information saved successfully.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      setIsEditing(false);
      setIsModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(
        "Error saving billing:",
        error.response?.data || error.message
      );
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to save billing. Please try again.",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  // get property Overall Details
  const { data: property } = useSWR(
    id ? `/api/propertyListing/viewDetailedProperty/${id}` : null,
    fetcher
  );

  const { data: subscription, isLoading: loadingSubscription } = useSWR(
    `/api/landlord/subscription/active/${landlord_id}`,
    fetcher
  );

  const {
    data: units,
    error,
    isLoading,
  } = useSWR(
    id ? `/api/unitListing/getUnitListings?property_id=${id}` : null,
    fetcher
  );

  //  Get Unit Billing Status
  useEffect(() => {
    const fetchUnitBillingStatus = async () => {
      if (!units || units.length === 0) return;

      const statusMap = {};

      await Promise.all(
        units.map(async (unit) => {
          try {
            const response = await axios.get(
              `/api/landlord/billing/getUnitDetails/billingStatus?unit_id=${unit.unit_id}`
            );
            statusMap[unit.unit_id] =
              response.data?.hasBillForThisMonth || false;
          } catch (error) {
            console.error(
              `Error fetching billing status for unit ${unit.unit_id}`,
              error
            );
          }
        })
      );

      setUnitBillingStatus(statusMap);
    };

    fetchUnitBillingStatus();
  }, [units]);

  const handleEditUnit = (unitId) => {
    router.push(
      `/pages/landlord/property-listing/view-unit/${id}/edit-unit/${unitId}`
    );
  };

  const handleAddUnitClick = () => {
    if (!subscription) {
      Swal.fire({
        title: "Subscription Required",
        text: "You need an active subscription to add a unit. Please subscribe to continue.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    if (units.length >= subscription.listingLimits.maxUnits) {
      Swal.fire({
        title: "Unit Limit Reached",
        text: `You have reached the maximum unit limit (${subscription.listingLimits.maxUnits}) for your plan.`,
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    Swal.fire({
      title: "Loading...",
      text: "Redirecting to add unit page...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      Swal.close();
      router.push(
        `/pages/landlord/property-listing/view-unit/${id}/create-unit?property_id=${id}`
      );
    }, 1500);
  };

  const handleDeleteUnit = async (unitId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await axios.delete(`/api/unitListing/unit?id=${unitId}`);

      if (response.status === 200) {
        Swal.fire("Deleted!", "Unit has been deleted.", "success");
        mutate(`/api/propertyListing/property/${id}`);
        mutate(`/api/unitListing/unit?property_id=${id}`);
      } else {
        Swal.fire(
          "Error",
          "Failed to delete the unit. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting unit:", error);

      let errorMessage = "Failed to delete the unit. Please try again.";

      if (error.response && error.response.data?.error) {
        if (
          error.response.data.error ===
          "Cannot delete unit with active lease agreement"
        ) {
          errorMessage =
            "This unit cannot be deleted because it has an active lease.";
        }
      }

      await Swal.fire("Error", errorMessage, "error");
    }
  };

  async function fetchPropertyDetails() {
    try {
      const response = await axios.get(
        "/api/propertyListing/getPropDetailsById",
        {
          params: { id },
        }
      );
      setPropertyDetails(response.data.property);
      console.log("property details:", response.data.property);
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    }
  }

  if (error)
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <p className="text-red-500 text-center">
              Failed to load units. Please try again later.
            </p>
          </div>
        </div>
      </LandlordLayout>
    );

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
        {/* HEADER PART - Mobile Optimized */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
          {/* Header Content */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-md">
                <BuildingOffice2Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
                  {isLoading
                    ? "Loading..."
                    : propertyDetails?.property_name || "Property Details"}
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                  Manage your rental units efficiently
                </p>
              </div>
            </div>

            {/* Subscription Usage - Mobile Friendly */}
            {subscription && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Unit Usage
                  </span>
                  <span className="text-sm font-semibold text-blue-700">
                    {units?.length}/{subscription.listingLimits.maxUnits}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (units?.length / subscription.listingLimits.maxUnits) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status Indicators - Stacked on Mobile */}
            <div className="space-y-3">
              {hasBillingForMonth && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                  <FaCheckCircle
                    className="text-green-600 flex-shrink-0"
                    size={18}
                  />
                  <span className="text-sm text-green-700 font-medium">
                    Property utility rates set for this month
                  </span>
                </div>
              )}

              {subscription &&
                units?.length >= subscription.listingLimits.maxUnits && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Unit limit reached</p>
                      <p className="text-xs text-red-600 mt-1">
                        Upgrade your plan to add more units
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Action Buttons - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              className={`flex items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                loadingSubscription ||
                !subscription ||
                units?.length >= subscription?.listingLimits?.maxUnits
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg active:scale-95"
              }`}
              onClick={handleAddUnitClick}
              disabled={
                loadingSubscription ||
                !subscription ||
                units?.length >= subscription?.listingLimits?.maxUnits
              }
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Add Unit</span>
            </button>

            <button
              onClick={() => setBillingMode(!billingMode)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${
                billingMode
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              <span className="text-sm">
                {billingMode ? "Exit Billing" : "Billing Mode"}
              </span>
            </button>

            {/* Utility Rate Button - Conditional */}
            {billingMode &&
              propertyDetails?.utility_billing_type === "submetered" && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <span className="text-sm">Set Utility Rate</span>
                </button>
              )}

            {/* FB Share Button */}
            {propertyDetails && (
              <div className="flex items-center">
                <FBShareButton
                  url={`https://rent-alley-web.vercel.app/pages/find-rent/${propertyDetails?.property_id}`}
                />
              </div>
            )}
          </div>

          {/* Non-submetered Info */}
          {billingMode &&
            propertyDetails?.utility_billing_type !== "submetered" && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Auto-billing active:</span>{" "}
                  Utility bills are generated automatically for non-submetered
                  properties.
                </p>
              </div>
            )}
        </div>

        {/* TABS NAVIGATION - Mobile Scrollable */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white rounded-xl p-1 shadow-md border border-gray-100">
            {[
              { id: "units", label: "Units", icon: HomeIcon },
              {
                id: "documents",
                label: "Documents",
                icon: ClipboardDocumentListIcon,
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: BuildingOffice2Icon,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Units Tab */}
          {activeTab === "units" && (
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm">
                  <HomeIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Available Units
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-2xl h-48"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : units && units.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {units.map((unit) => (
                    <div
                      key={unit?.unit_id}
                      className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Unit Header */}
                      <div className="relative">
                        <div className="h-32 sm:h-36 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center cursor-pointer group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                          <div className="text-center text-white">
                            <HomeIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2" />
                            <h3 className="text-lg sm:text-xl font-bold">
                              Unit {unit?.unit_name}
                            </h3>
                          </div>
                        </div>

                        {/* Billing Status Badge */}
                        {unitBillingStatus[unit.unit_id] && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full shadow-md">
                            <FaCheckCircle size={14} />
                            <span className="text-xs font-medium">Billed</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
                              unit?.status === "Occupied"
                                ? "bg-green-100 text-green-800"
                                : unit?.status === "Unoccupied"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {unit?.status}
                          </span>
                        </div>
                      </div>

                      {/* Unit Content */}
                      <div className="p-4">
                        {/* Unit Info */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium text-gray-800">
                              Size:
                            </span>{" "}
                            {unit?.unit_size} sqm
                          </p>

                          <button
                            onClick={() =>
                              router.push(
                                `/pages/landlord/property-listing/view-unit/${id}/unit-details/${unit.unit_id}`
                              )
                            }
                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm border border-gray-200"
                          >
                            View Unit Details
                          </button>
                        </div>

                        <hr className="border-gray-200 mb-4" />

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <button
                            className="w-full flex items-center justify-center px-3 py-2.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/pages/landlord/property-listing/view-unit/tenant-req/${unit.unit_id}`
                              );
                            }}
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                            Prospective Leads
                          </button>

                          {/* Edit/Delete Actions */}
                          <div className="flex gap-2">
                            <button
                              className="flex-1 p-2.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUnit(unit.unit_id);
                              }}
                              aria-label="Edit unit"
                            >
                              <PencilSquareIcon className="h-4 w-4 mx-auto" />
                            </button>

                            <button
                              className="flex-1 p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit.unit_id);
                              }}
                              aria-label="Delete unit"
                            >
                              <TrashIcon className="h-4 w-4 mx-auto" />
                            </button>
                          </div>
                        </div>

                        {/* Billing Mode Actions */}
                        {billingMode && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                            <Link
                              href={`/pages/landlord/billing/billingHistory/${unit.unit_id}`}
                              className="block"
                            >
                              <button className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors font-medium text-sm">
                                Billing History
                              </button>
                            </Link>

                            <Link
                              href={`/pages/landlord/billing/payments/${unit.unit_id}`}
                              className="block"
                            >
                              <button className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium text-sm">
                                View Payments
                              </button>
                            </Link>

                            {unitBillingStatus[unit.unit_id] ? (
                              <Link
                                href={`/pages/landlord/billing/editUnitBill/${unit?.unit_id}`}
                                className="block"
                              >
                                <button className="w-full bg-amber-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors font-medium text-sm">
                                  Edit Unit Bill
                                </button>
                              </Link>
                            ) : (
                              <Link
                                href={`/pages/landlord/billing/createUnitBill/${unit?.unit_id}`}
                                className="block"
                              >
                                <button className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors font-medium text-sm">
                                  Create Unit Bill
                                </button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
                    <HomeIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg font-semibold mb-2">
                    No Units Available
                  </p>
                  <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
                    Start building your rental portfolio by adding your first
                    unit
                  </p>
                  <button
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    onClick={handleAddUnitClick}
                  >
                    Add Your First Unit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="p-4 sm:p-6">
              <PropertyDocumentsTab propertyId={id} />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-sm">
                  <BuildingOffice2Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Engagement Analytics
                </h2>
              </div>

              <p className="text-gray-600 mb-6">
                Track how your property performs with detailed engagement
                insights.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-blue-700 mb-2">
                    Page Views
                  </h3>
                  <p className="text-3xl font-bold text-blue-900 mb-1">1,240</p>
                  <p className="text-xs text-blue-600">+12% from last month</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-green-700 mb-2">
                    Inquiries
                  </h3>
                  <p className="text-3xl font-bold text-green-900 mb-1">56</p>
                  <p className="text-xs text-green-600">+8% from last month</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-purple-700 mb-2">
                    Shares
                  </h3>
                  <p className="text-3xl font-bold text-purple-900 mb-1">19</p>
                  <p className="text-xs text-purple-600">+3% from last month</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Modal for Property Utility Rate */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white p-5 border-b border-gray-200 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-sm">
                    <BuildingOffice2Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Property Utility Rates
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Current Billing Status */}
                {billingData ? (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FaCheckCircle className="text-green-600" size={18} />
                      <h3 className="font-bold text-green-800">
                        Current Billing Period
                      </h3>
                    </div>
                    <p className="text-gray-700 mb-4 font-medium">
                      Period:{" "}
                      <span className="text-green-800">
                        {billingForm?.billingPeriod}
                      </span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                            Electricity
                          </h4>
                        </div>
                        <p className="text-xl font-bold text-gray-800 mb-1">
                          ₱
                          {billingData.find(
                            (b) => b.utility_type === "electricity"
                          )?.total_billed_amount || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {billingData.find(
                            (b) => b.utility_type === "electricity"
                          )?.rate_consumed || "N/A"}{" "}
                          kWh
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-green-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                            Water
                          </h4>
                        </div>
                        <p className="text-xl font-bold text-gray-800 mb-1">
                          ₱
                          {billingData.find((b) => b.utility_type === "water")
                            ?.total_billed_amount || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {billingData.find((b) => b.utility_type === "water")
                            ?.rate_consumed || "N/A"}{" "}
                          cu. meters
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BuildingOffice2Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      No billing data found for this month
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Set up your utility rates below
                    </p>
                  </div>
                )}

                {/* Form Section */}
                <form
                  className="space-y-6"
                  onSubmit={handleSaveOrUpdateBilling}
                >
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Billing Period
                    </label>
                    <input
                      name="billingPeriod"
                      value={billingForm.billingPeriod}
                      onChange={handleInputChange}
                      type="date"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>

                  {/* Electricity Section */}
                  <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">⚡</span>
                      </div>
                      <h3 className="text-lg font-bold text-orange-800">
                        Electricity
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            ₱
                          </span>
                          <input
                            type="number"
                            name="electricityTotal"
                            value={billingForm.electricityTotal}
                            onChange={handleInputChange}
                            className="w-full border border-yellow-300 rounded-xl p-3 pl-8 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-500 outline-none transition-all duration-200 bg-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Consumption (kWh)
                        </label>
                        <input
                          type="number"
                          name="electricityRate"
                          value={billingForm.electricityRate}
                          onChange={handleInputChange}
                          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-500 outline-none transition-all duration-200 bg-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Water Section */}
                  <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">💧</span>
                      </div>
                      <h3 className="text-lg font-bold text-cyan-800">Water</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Total Amount Billed
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            ₱
                          </span>
                          <input
                            type="number"
                            name="waterTotal"
                            value={billingForm.waterTotal}
                            onChange={handleInputChange}
                            className="w-full border border-cyan-300 rounded-xl p-3 pl-8 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500 outline-none transition-all duration-200 bg-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Consumption (cubic meters)
                        </label>
                        <input
                          type="number"
                          name="waterRate"
                          value={billingForm.waterRate}
                          onChange={handleInputChange}
                          className="w-full border border-cyan-300 rounded-xl p-3 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-500 outline-none transition-all duration-200 bg-white"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white p-5 border-t border-gray-200 rounded-b-2xl flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrUpdateBilling}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold order-1 sm:order-2"
                >
                  {hasBillingForMonth ? "Update Rates" : "Save Rates"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default ViewUnitPage;
