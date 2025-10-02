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
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../../../../../zustand/authStore";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import PropertyDocumentsTab from "../../../../../../components/landlord//properties/PropertyDocumentsTab";
import FBShareButton from "../../../../../../components/landlord/properties/shareToFacebook";
import UnitsTab from "../../../../../../components/landlord/properties/UnitsTab";
const fetcher = (url) => axios.get(url).then((res) => res.data);
import { BackButton } from "@/components/navigation/backButton";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import PropertyConfiguration from "@/components/landlord/properties/propertyConfigSettings";
import { Pagination } from "@mui/material";

const ViewUnitPage = () => {
  const { id } = useParams();
  const property_id = id;
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const router = useRouter();
  const { fetchSession, user, admin } = useAuthStore();
  const landlord_id = user?.landlord_id;
  const [isNavigating, setIsNavigating] = useState(false);
  const [billingMode, setBillingMode] = useState(false);
  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityConsumption: "", // ⚡ Highlighted in UI
    electricityTotal: "",       // secondary
    waterConsumption: "",       //  Highlighted in UI
    waterTotal: "",             // secondary
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);
  const [unitBillingStatus, setUnitBillingStatus] = useState({});
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("units");

  // Billing Status and rates deta
  useEffect(() => {
    if (!property_id) return;

    async function fetchBillingData_PropertyUtility() {
      try {
        const response = await axios.get(
            `/api/landlord/billing/checkPropertyBillingStats`,
            { params: { property_id } }
        );

        if (response.data.billingData) {
          const data = response.data.billingData;

          setBillingData(data);
          setHasBillingForMonth(true);

          setBillingForm({
            billingPeriod: data.billing_period || "",
            electricityTotal: data.electricity?.total || "",
            electricityConsumption: data.electricity?.consumption || "",
            waterTotal: data.water?.total || "",
            waterConsumption: data.water?.consumption || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (error: any) {
        console.error(
            "Failed to fetch billing data:",
            error.response?.data || error.message
        );
      }
    }

    fetchBillingData_PropertyUtility();
    fetchPropertyDetails();
  }, [property_id]);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" }); // smooth scroll to top
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  //  added manual and guided billing
  const handleSaveOrUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const url = hasBillingForMonth
          ? "/api/landlord/billing/updateConcessionaireRates"
          : "/api/landlord/billing/savePropertyUtilityBillingMonthly";

      await axios({
        method: hasBillingForMonth ? "PUT" : "POST",
        url,
        data: {
          property_id: property_id, // always property-level now
          ...billingForm,
        },
      });

      Swal.fire("Success", "Billing saved successfully.", "success");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save billing.", "error");
    }
  };

  // get property Overall Details
  const { data: property } = useSWR(
    id ? `/api/propertyListing/viewDetailedProperty/${property_id}` : null,
    fetcher
  );

  // get the subscription status
  const { data: subscription, isLoading: loadingSubscription } = useSWR(
    `/api/landlord/subscription/active/${landlord_id}`,
    fetcher
  );
  //  get property units
  const {
    data: units,
    error,
    isLoading,
  } = useSWR(
    id ? `/api/unitListing/getUnitListings?property_id=${property_id}` : null,
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
      `/pages/landlord/property-listing/view-unit/${property_id}/edit-unit/${unitId}`
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
        `/pages/landlord/property-listing/view-unit/${property_id}/create-unit?property_id=${id}`
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
        mutate(`/api/propertyListing/property/${property_id}`);
        mutate(`/api/unitListing/unit?property_id=${property_id}`);
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
          params: { property_id },
        }
      );
      setPropertyDetails(response.data.property);
      console.log("property details:", response.data.property);
    } catch (error) {
      console.error("Failed to fetch property details:", error);
    }
  }

  const currentUnits = units?.slice(startIndex, startIndex + itemsPerPage) || [];

  //  only applicsable for both non-submtered utility.
  const handleReviewBilling = () => {
    router.push(`/pages/landlord/billing/reviewBilling/${property_id}`);
  };

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
        <BackButton label='Back to Properties'/>

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

            {billingMode &&
                (propertyDetails?.electricity_billing_type === "submetered" ||
                    propertyDetails?.water_billing_type === "submetered") && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    >
                      <span className="text-sm">Set Property Rates</span>
                    </button>
                )}

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
            {/*{propertyDetails && (*/}
            {/*  <div className="flex items-center">*/}
            {/*    <FBShareButton*/}
            {/*      url={`https://rent-alley-web.vercel.app/pages/find-rent/${propertyDetails?.property_id}`}*/}
            {/*    />*/}
            {/*  </div>*/}
            {/*)}*/}

          </div>

          {/* Non-submetered Info */}
          {billingMode &&
              (propertyDetails?.water_billing_type !== "submetered" ||
                  propertyDetails?.electricity_billing_type !== "submetered") && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Auto-billing:</span>{" "}
                      Monthly Billing is generated automatically based on the set due date
                      for non-submetered properties.
                    </p>

                    <button
                        onClick={handleReviewBilling}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    >
                      Review Billing for this Month
                    </button>
                  </div>
              )}

        </div>

        {/* TABS NAVIGATION - Mobile Scrollable */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white rounded-xl p-1 shadow-md border border-gray-100">
            {[
              { id: "units", label: "Units", icon: HomeIcon },
              { id: "documents", label: "Documents", icon: ClipboardDocumentListIcon },
              { id: "analytics", label: "Analytics", icon: BuildingOffice2Icon },
              { id: "configuration", label: "Configuration", icon: Cog6ToothIcon },
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
              <>
                <UnitsTab
                    units={currentUnits}
                    isLoading={isLoading}
                    unitBillingStatus={unitBillingStatus}
                    billingMode={billingMode}
                    propertyId={property_id}
                    propertyDetails={propertyDetails}
                    handleEditUnit={handleEditUnit}
                    handleDeleteUnit={handleDeleteUnit}
                    handleAddUnitClick={handleAddUnitClick}
                />

                {units && units.length > itemsPerPage && (
                    <div className="flex justify-center p-4 bg-white border-t border-gray-100">
                      <Pagination
                          count={Math.ceil(units.length / itemsPerPage)}
                          page={page}
                          onChange={handlePageChange}
                          color="primary"
                          shape="rounded"
                          size="large"
                      />
                    </div>
                )}
              </>
          )}


          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="p-4 sm:p-6">
              <PropertyDocumentsTab propertyId={property_id} />
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

          {/* Configuration Tab */}
          {activeTab === "configuration" && (
              <PropertyConfiguration propertyId={property_id} />
          )}

        </div>

        {/* Enhanced Modal for Property Utility Rate */}
        <PropertyRatesModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            billingData={billingData}
            billingForm={billingForm}
            propertyDetails={propertyDetails}
            hasBillingForMonth={hasBillingForMonth}
            handleInputChange={handleInputChange}
            handleSaveOrUpdateBilling={handleSaveOrUpdateBilling}
        />

      </div>
    </LandlordLayout>
  );

};

export default ViewUnitPage;
