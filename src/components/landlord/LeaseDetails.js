"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import LeaseUpload from "./LeaseUpload";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
} from "react-icons/hi";
import { PhoneIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";
import { UserIcon } from "lucide-react";

const LeaseDetails = ({ unitId, tenantId }) => {
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
  const [prospectiveStatus, setProspectiveStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const searchParams = useSearchParams();
  const queryTenantId = tenantId || searchParams.get("tenant_id");

  useEffect(() => {
    fetchLeaseDetails();
    fetchTenantDetails();
    fetchStatus();
    fetchUnitDetails();
    fetchProspectiveStatus();
  }, [queryTenantId]);

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

  const fetchProspectiveStatus = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/getProspectiveStatus?unit_id=${unitId}&tenant_id=${tenantId}`
      );
      setProspectiveStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching tenant status:", error);
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

  // Fetch current status of unit
  const fetchStatus = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/propertyStatus/getStatus?unitId=${unitId}`
      );
      if (response.data.status) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  // Approve or Disapprove tenant
  const updateTenantStatus = async (newStatus) => {
    let disapprovalReason = null;

    if (newStatus === "disapproved") {
      const { value } = await Swal.fire({
        title: "Disapprove Tenant",
        input: "textarea",
        inputLabel: "Provide a reason for disapproval",
        inputPlaceholder: "Type your reason here...",
        inputAttributes: { "aria-label": "Disapproval reason" },
        showCancelButton: true,
      });

      if (!value) return;
      disapprovalReason = value;
    }

    try {
      const payload = {
        unitId,
        tenant_id: tenant?.tenant_id,
        status: newStatus,
        message: newStatus === "disapproved" ? disapprovalReason : null,
      };

      await axios.put("/api/landlord/prospective/update-status", payload);

      Swal.fire("Success!", `Tenant ${newStatus} successfully!`, "success");

      if (newStatus === "approved") {
        await axios.put("/api/landlord/propertyStatus/update", {
          unitId,
          status: "occupied",
        });

        setStatus("occupied");
        setProspectiveStatus("approved");
      } else {
        setProspectiveStatus("disapproved");
      }
    } catch (error) {
      Swal.fire("Error!", "Failed to update tenant status.", "error");
      console.error("Error updating tenant status:", error);
    }
  };

  // Handle unit occupancy status update
  const toggleUnitStatus = async () => {
    if (isUpdatingStatus) return; // Prevent multiple clicks
    
    setIsUpdatingStatus(true);
    const newStatus = status === "occupied" ? "unoccupied" : "occupied";

    try {
      await axios.put("/api/landlord/propertyStatus/update", {
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
        `/api/leaseAgreement/getLease?unit_id=${unitId}&tenant_id=${tenantId}`
      );

      if (response.data.length > 0) {
        const leaseData = response.data[0];
        setLease(leaseData);
        setStartDate(leaseData.start_date || "");
        setEndDate(leaseData.end_date || "");

        console.log("Lease Data: ", leaseData);
      }
    } catch (error) {
      console.error("Error fetching lease details:", error);
    }
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("leaseFile", file);
    formData.append("unit_id", unitId);
    formData.append("tenant_id", tenantId);

    try {
      await axios.put(
        `/api/leaseAgreement/uploadLease?unit_id=${unitId}&tenant_id=${tenantId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      Swal.fire("Success", "Lease agreement uploaded successfully", "success");
      fetchLeaseDetails();
    } catch (error) {
      console.error("Error uploading lease file:", error);
      Swal.fire("Error", "Failed to upload lease agreement", "error");
    }
  };

  const fetchTenantDetails = async () => {
    setIsLoading(true);
    try {
      if (queryTenantId) {
        const response = await axios.get(
          `/api/landlord/prospective/interested-tenants?tenant_id=${queryTenantId}`
        );
        if (response.data) {
          setTenant(response.data);
        }
      } else {
        // Fallback to previous behavior if no tenant_id is provided
        const response = await axios.get(
          `/api/landlord/prospective/interested-tenants?unitId=${unitId}`
        );
        if (response.data.length > 0) {
          setTenant(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
      setError("Failed to load tenant information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLease = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        title: "Error",
        text: "Start date and End date cannot be empty!",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      await axios.put(
        `/api/leaseAgreement/leaseDetails?unit_id=${unitId}&tenant_id=${tenantId}`,
        {
          start_date: startDate,
          end_date: endDate,
        }
      );
      Swal.fire("Success", "Lease dates updated successfully", "success");
      fetchLeaseDetails();
    } catch (error) {
      console.error("Error updating lease:", error);
      Swal.fire("Error", "Failed to update lease dates", "error");
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
            `/api/leaseAgreement/deleteLease?unit_id=${unitId}&tenant_id=${tenantId}`
          );
          Swal.fire("Deleted!", "Lease agreement has been deleted.", "success");
          setLease(null); // Remove lease from state
        } catch (error) {
          console.error("Error deleting lease:", error);
          Swal.fire("Error!", "Failed to delete lease agreement.", "error");
        }
      }
    });
  };

  const isTenantApproved = prospectiveStatus === "approved" || status === "occupied";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <FaArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      {/* Property Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-48 bg-gray-200 relative">
          {unitPhoto ? (
            <Image
              src={unitPhoto}
              alt="Unit Photo"
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
              No Image Available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-6">
            <h1 className="text-white text-2xl font-bold">
              {propertyName || "Property Name"}
            </h1>
            <p className="text-white text-lg">Unit {unitName || "Unit Name"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-3 font-medium text-sm ${
              activeTab === "details"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Renter Details
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm ${
              activeTab === "maintenance"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("maintenance")}
          >
            Maintenance Request History
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Tenant History
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tenant Info Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start mb-4">
                {/* Profile Image */}
                <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {tenant?.profilePicture ? (
                    <Image
                      src={tenant?.profilePicture}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="w-full h-full rounded-full object-cover object-center border-2 border-gray-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border-2 border-gray-300 shadow-lg bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-500" />{" "}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {tenant?.firstName} {tenant?.lastName}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Date of Birth: {formatDate(tenant?.birthDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email Address:</p>
                    <p className="text-gray-800 font-medium">{tenant?.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <PhoneIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <HiOutlineBriefcase className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Occupation:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.occupation}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <HiOutlineCurrencyDollar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Income:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.monthly_income?.replace("_", "-")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <HiOutlineUser className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Employment Status:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.employment_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.address}
                    </p>
                  </div>
                </div>

                {/* Valid Government ID Section */}
                {tenant?.valid_id ? (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">
                      Valid Government ID:
                    </p>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-blue-100 text-blue-500 flex items-center justify-center mr-3">
                          <IdentificationIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Tenant's Valid ID
                          </p>
                          <Link
                            href={tenant?.valid_id}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            View Government ID
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">No valid ID available</p>
                )}
              </div>
            </div>
          </div>

          {/* Lease Agreement Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Lease Agreement
              </h2>

              {!isTenantApproved ? (
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <LockClosedIcon className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Lease Agreement Locked</h3>
                    <p className="text-gray-600 mb-4">
                      You must approve this tenant before managing their lease agreement.
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 transition duration-300"
                        onClick={() => updateTenantStatus("approved")}
                      >
                        Approve Tenant
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg shadow-sm hover:bg-red-700 transition duration-300"
                        onClick={() => updateTenantStatus("disapproved")}
                      >
                        Disapprove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Lease Dates Update Section */}
                  <div className="mb-6">
                    <p className="text-md text-gray-500 mb-2">Lease Dates:</p>
                    {/* Display Start and End Dates */}
                    {lease?.start_date && lease?.end_date && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-700 text-md mb-2">
                          Start Date: {formatDate(lease.start_date)}
                        </p>
                        <p className="text-gray-700 text-md">
                          End Date: {formatDate(lease.end_date)}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          Start Date:
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-gray-700 text-sm font-bold mb-2"
                        >
                          End Date:
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateLease}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                    >
                      Update Lease Dates
                    </button>
                  </div>

                  {/* Lease Agreement Upload/View/Delete Section */}
                  {lease?.agreement_url ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Lease Agreement:</p>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-green-100 text-green-500 flex items-center justify-center mr-3">
                            <DocumentTextIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Current Lease Agreement
                            </p>
                            <Link
                              href={lease.agreement_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View Lease Agreement
                            </Link>
                          </div>
                        </div>
                        <button
                          onClick={handleDeleteLease}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                          Delete Lease
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Upload Lease Agreement:
                      </p>
                      <LeaseUpload onFileUpload={handleFileUpload} />
                    </div>
                  )}
                  
                  {/* Mark as Unoccupied button - moved inside the lease agreement card */}
                  {status === "occupied" && (
                    <div className="mt-6 border-t pt-4">
                      <p className="text-sm text-gray-500 mb-2">Unit Status:</p>
                      <button
                        className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 disabled:opacity-50"
                        onClick={toggleUnitStatus}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Updating..." : "Mark as Unoccupied"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Maintenance Request History
          </h2>
          <p className="text-gray-500 text-center py-6">
            No maintenance requests found
          </p>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Tenant History
          </h2>
          <p className="text-gray-500 text-center py-6">
            No previous tenant history for this unit
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaseDetails;