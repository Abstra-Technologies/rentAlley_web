"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import LeaseUpload from "./LeaseUpload";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import {
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
} from "react-icons/hi";
import { PhoneIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";
import { UserIcon } from "lucide-react";

// @ts-ignore
const LeaseDetails = ({ unitId }) => {
  const router = useRouter();
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("unoccupied");
  const [unitName, setUnitName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [unitPhoto, setUnitPhoto] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [leaseFile, setLeaseFile] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [leaseMode, setLeaseMode] = useState<"generate" | "upload" | null>(null);
  const [IsGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    fetchLeaseDetails();
    fetchTenantDetails();
    fetchStatus();
    fetchUnitDetails();
  }, [unitId]);

  // @ts-ignore
  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const fetchUnitDetails = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/getUnitInfo?unit_id=${unitId}`
      );

      console.log("API Response:", response.data);

      if (response.data) {
        setUnitName(response.data.unit?.unit_name || "");
        setPropertyName(response.data.property?.property_name || "");
        setUnitPhoto(response.data.photos?.[0] || "");
      }
    } catch (error) {
      console.error("Error fetching unit details:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/properties/getCurrentStatus?unitId=${unitId}`
      );
      if (response.data.status) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const toggleUnitStatus = async () => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    const newStatus = status === "occupied" ? "unoccupied" : "occupied";

    try {
      await axios.put("/api/landlord/properties/updatePropertyUnitStatus", {
        unitId,
        status: newStatus,
      });

      setStatus(newStatus);
      Swal.fire("Success", `Status updated to ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire("Error", "Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchLeaseDetails = async () => {
    try {
      const response = await axios.get(
        `/api/leaseAgreement/getLeasePerUnit?unit_id=${unitId}`
      );

      if (response.data.length > 0) {
        const leaseData = response.data[0];
        setLease(leaseData);
        setStartDate(leaseData?.start_date || "");
        setEndDate(leaseData?.end_date || "");

        console.log("Lease Data: ", leaseData);
      }
    } catch (error) {
      console.error("Error fetching lease details:", error);
    }
  };

  const fetchTenantDetails = async () => {
    setIsLoading(true);
    try {
      if (unitId) {
        const response = await axios.get(
          `/api/landlord/prospective/getApprovedTenantsDetails?unit_id=${unitId}`
        );

        console.log("Tenant API Response:", response.data);
        if (response.data) {
          setTenant(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      // @ts-ignore
      setError("Failed to load tenant information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLease = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will permanently delete the lease agreement!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `/api/leaseAgreement/deleteLeaseAgreement?unit_id=${unitId}`
          );
          Swal.fire("Deleted!", "Lease agreement has been deleted.", "success");
          setLease(null);
        } catch (error) {
          console.error("Error deleting lease:", error);
          Swal.fire("Error!", "Failed to delete lease agreement.", "error");
        }
      }
    });
  };

  const handleSendInvite = async () => {
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        unitId,
        propertyName,
        unitName,
      }),
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire("Sent!", "Invitation email sent to tenant.", "success");
    } else {
      Swal.fire("Error", data.error || "Could not send invite.", "error");
    }
  };

  const handleSaveLease = async () => {
    if (!startDate || !endDate) {
      Swal.fire("Error", "Start and end date are required", "error");
      return;
    }

    if (endDate <= startDate) {
      Swal.fire("Error", "End date must be after start date", "error");
      return;
    }

    try {
      if (leaseFile) {
        const formData = new FormData();
        formData.append("leaseFile", leaseFile);
        formData.append("unit_id", unitId || "");

        const uploadRes = await fetch("/api/leaseAgreement/uploadUnitLease", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error("Upload failed:", errorText);
          Swal.fire("Error", "File upload failed", "error");
          return;
        }
      }

      const leaseDateRes = await fetch(
        "/api/leaseAgreement/updateLeaseDateSet",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            unit_id: unitId,
            start_date: startDate,
            end_date: endDate,
          }),
        }
      );

      if (!leaseDateRes.ok) {
        const errorText = await leaseDateRes.text(); // optional for logging
        console.error("Lease date update failed:", errorText);
        throw new Error(
          `Lease date update failed with status ${leaseDateRes.status}`
        );
      }

      Swal.fire("Success", "Lease saved successfully", "success");
      fetchLeaseDetails?.();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to save lease", "error");
    }
  };

  // Example: inside your LeaseAgreement component
  const handleGenerateLease = async () => {
    if (!startDate || !endDate) {
      Swal.fire("Error", "Start and end date are required", "error");
      return;
    }

    if (endDate <= startDate) {
      Swal.fire("Error", "End date must be after start date", "error");
      return;
    }

    try {
      setIsGenerating(true);

      // Collect payload from state
      const payload = {
        tenantName: tenant ? `${tenant?.firstName} ${tenant?.lastName}` : "Tenant",
        tenantEmail: tenant?.email || "",
        propertyName,
        unitName,
        startDate,
        endDate,
        unitId,
        monthlyRent: lease?.rent_amount || null,
        securityDeposit: lease?.sec_deposit || null,
      };

      // ✅ Redirect to rich text editor page with query params
      const query = new URLSearchParams(payload as any).toString();
      router.push(`/pages/lease/generate/${unitId}?${query}`);
    } catch (err) {
      console.error("Error preparing lease:", err);
      Swal.fire("Error", "Failed to prepare lease", "error");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      {/* Enhanced Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Units</span>
        <span className="sm:hidden">Back</span>
      </button>

      {/* Enhanced Header Section */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4 sm:mb-6 border border-gray-200">
        <div className="relative h-48 sm:h-56 bg-gradient-to-r from-blue-600 to-purple-600">
          {unitPhoto ? (
            <Image
              src={unitPhoto}
              alt="Unit Photo"
              layout="fill"
              objectFit="cover"
              className="rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-8 w-8" />
                </div>
                <p className="text-white/80">No Image Available</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <h1 className="text-white text-xl sm:text-2xl font-bold mb-1">
              {propertyName || "Property Name"}
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Unit {unitName || "Unit Name"}
            </p>
            {/* Status Badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                  status === "occupied"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {status === "occupied" ? "Occupied" : "Available"}
              </span>
            </div>
          </div>
        </div>

        {/* No Tenant Warning */}
        {!tenant && (
          <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mt-0.5">
                <EnvelopeIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800 mb-2">
                  No Tenant Assigned
                </h3>
                <p className="text-amber-700 text-sm mb-4">
                  Send an invitation to connect a tenant to this unit. They'll
                  receive an email with registration instructions.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      placeholder="Enter tenant's email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-white border border-amber-200 px-4 py-2.5 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSendInvite}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Send Invite
                  </button>
                </div>

                <button
                  className="mt-3 text-blue-600 hover:text-blue-800 underline font-medium text-sm"
                  onClick={() =>
                    router.push(`/landlord/prospectives/${unitId}`)
                  }
                >
                  View prospective tenants instead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="border-t border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: "details", label: "Tenant Details", icon: UserIcon },
              {
                id: "maintenance",
                label: "Maintenance",
                icon: DocumentTextIcon,
              },
              { id: "history", label: "History", icon: DocumentTextIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-blue-600 bg-blue-50/50"
                      : "text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tenant Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 shadow-md">
                  {tenant?.profilePicture ? (
                    <Image
                      src={tenant?.profilePicture}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                    {tenant
                      ? `${tenant?.firstName} ${tenant?.lastName}`
                      : "No Tenant Assigned"}
                  </h2>
                  {tenant?.birthDate && (
                    <p className="text-gray-500 text-sm">
                      Born: {formatDate(tenant?.birthDate)}
                    </p>
                  )}
                </div>
              </div>

              {tenant ? (
                <div className="space-y-4">
                  {[
                    {
                      icon: EnvelopeIcon,
                      label: "Email",
                      value: tenant?.email,
                    },
                    {
                      icon: PhoneIcon,
                      label: "Phone",
                      value: tenant?.phoneNumber,
                    },
                    {
                      icon: HiOutlineBriefcase,
                      label: "Occupation",
                      value: tenant?.occupation,
                    },
                    {
                      icon: HiOutlineCurrencyDollar,
                      label: "Monthly Income",
                      value: tenant?.monthlyIncome?.replace("_", "-"),
                    },
                    {
                      icon: HiOutlineUser,
                      label: "Employment",
                      value: tenant?.employmentType,
                    },
                    {
                      icon: MapPinIcon,
                      label: "Address",
                      value: tenant?.address,
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {item.label}
                          </p>
                          <p className="text-gray-800 font-medium break-words">
                            {item.value || "Not provided"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Valid ID Section */}
                  {tenant?.validId ? (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <IdentificationIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-800 mb-1">
                            Government ID
                          </p>
                          <Link
                            href={tenant?.validId}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                          >
                            View Verification Document
                          </Link>
                        </div>
                        <FaCheckCircle className="text-green-500 h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-500 text-center">
                        No ID verification available
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    No tenant information available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lease Agreement Card  */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Lease Agreement
                </h2>
              </div>

              {/* Current Lease Dates Display */}
              {lease?.start_date && lease?.end_date && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Active Lease Period
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Start Date
                      </p>
                      <p className="text-gray-800 font-semibold">
                        {formatDate(lease.start_date)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        End Date
                      </p>
                      <p className="text-gray-800 font-semibold">
                        {formatDate(lease.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Input Section */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Set Lease Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Lease Document Section */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Lease Document</h3>

                {/* Selection Toggle */}
                <div className="flex gap-3 mb-4">
                  <button
                      onClick={() => setLeaseMode("generate")}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium border transition ${
                          leaseMode === "generate"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Use System Template
                  </button>
                  <button
                      onClick={() => setLeaseMode("upload")}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium border transition ${
                          leaseMode === "upload"
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Upload PDF
                  </button>
                </div>

                {/* Existing Agreement Display */}
                {lease?.agreement_url ? (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-800 mb-1">
                            Current Lease Agreement
                          </p>
                          <Link
                              href={lease.agreement_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                          >
                            View Agreement Document
                          </Link>
                        </div>
                        <FaCheckCircle className="text-green-500 h-5 w-5" />
                      </div>
                    </div>
                ) : leaseMode === "upload" ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Upload New Lease Agreement
                      </p>
                      <LeaseUpload setLeaseFile={setLeaseFile} />
                    </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {leaseMode === "generate" && (
                    <button
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={handleGenerateLease}
                    >
                      Generate Lease Agreement
                    </button>
                )}

                {leaseMode === "upload" && (
                    <button
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        onClick={handleSaveLease}
                    >
                      Upload Lease Agreement
                    </button>
                )}

                {/* Mark Unit Status Button */}
                <button
                    className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === "occupied"
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    }`}
                    onClick={toggleUnitStatus}
                    disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus
                      ? "Updating Status..."
                      : status === "occupied"
                          ? "Mark as Unoccupied"
                          : "Mark as Occupied"}
                </button>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === "maintenance" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Maintenance Requests
            </h2>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-2">
              No Maintenance Requests
            </p>
            <p className="text-gray-400 text-sm">
              All maintenance requests will appear here
            </p>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Tenant History</h2>
          </div>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-2">
              No Previous Tenants
            </p>
            <p className="text-gray-400 text-sm">
              Historical tenant information will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default LeaseDetails;
