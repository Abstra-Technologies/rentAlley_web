"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import LeaseUpload from "./LeaseUpload";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { PhoneIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";
import { UserIcon } from "lucide-react";

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
  const [prospectiveStatus, setProspectiveStatus] = useState("pending");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchLeaseDetails();
    fetchTenantDetails();
    fetchStatus();
    fetchUnitDetails();
    fetchProspectiveStatus();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A"; // Or handle the case where the date is not available
    }

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date"; // Handle invalid date strings
    }
  };

  // Fetch prospective tenant status (pending/approved/disapproved)
  const fetchProspectiveStatus = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/getProspectiveStatus?unit_id=${unitId}`
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

      console.log("API Response:", response.data); // Log the entire response

      if (response.data) {
        setUnitName(response.data.unit?.unit_name || ""); // Safe access, default to empty string
        setPropertyName(response.data.property?.property_name || ""); // Safe access, default to empty string
        setUnitPhoto(response.data.photos?.[0] || ""); // Safe access to the first photo, default to empty string
      }
    } catch (error) {
      console.error("Error fetching unit details:", error);
    }
  };

  // Fetch current status of  unit
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

      if (!value) return; // Ensure the user provided a reason
      disapprovalReason = value;
    }

    try {
      const payload = {
        unitId,
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
    }
  };
  // Fetch lease details
  const fetchLeaseDetails = async () => {
    try {
      const response = await axios.get(
        `/api/leaseAgreement/getLease?unit_id=${unitId}`
      );

      if (response.data.length > 0) {
        const leaseData = response.data[0]; // Access the first lease record
        setLease(leaseData);
        setStartDate(leaseData.start_date || "");
        setEndDate(leaseData.end_date || "");

        console.log("Lease Data: ", leaseData);
      }
    } catch (error) {
      console.error("Error fetching lease details:", error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("leaseFile", file);
    formData.append("unit_id", unitId);

    try {
      await axios.post(
        `/api/leaseAgreement/uploadLease?unit_id=${unitId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      Swal.fire("Success", "Lease agreement uploaded successfully", "success");
      fetchLeaseDetails(); // Refresh lease details
    } catch (error) {
      console.error("Error uploading lease file:", error);
      Swal.fire("Error", "Failed to upload lease agreement", "error");
    }
  };

  // Fetch tenant details
  const fetchTenantDetails = async () => {
    try {
      const response = await axios.get(
        `/api/landlord/prospective/interested-tenants?unitId=${unitId}`
      );

      if (response.data.length > 0) {
        setTenant(response.data[0]); // Assuming the first tenant is the one leasing
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
  };

  // Handle lease date update
  const handleUpdateLease = async () => {
    try {
      await axios.put(`/api/leaseAgreement/leaseDetails?unit_id=${unitId}`, {
        start_date: startDate,
        end_date: endDate,
      });
      Swal.fire("Success", "Lease dates updated successfully", "success");
      fetchLeaseDetails(); // Refresh data
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
            `/api/leaseAgreement/deleteLease?unit_id=${unitId}`
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
          {/* Display Unit Photo if Available */}
          {unitPhoto ? (
            <Image
              src={unitPhoto}
              alt="Unit Photo"
              layout="fill" // Makes the image fill the container
              objectFit="cover" // Ensures the image covers the container without distortion
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
                      src={tenant.profilePicture}
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
                  <MapPinIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Address:</p>
                    <p className="text-gray-800 font-medium">
                      {tenant?.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lease Agreement Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Lease Agreement
              </h2>

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
                      disabled={!lease?.agreement_url} // Disable if no lease agreement
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
                      disabled={!lease?.agreement_url} // Disable if no lease agreement
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdateLease}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                  disabled={!lease?.agreement_url} // Disable if no lease agreement
                >
                  Update Lease Dates
                </button>
                {!lease?.agreement_url && (
                  <div
                    className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-2"
                    role="alert"
                  >
                    <span className="block sm:inline">
                      {" "}
                      Please upload a lease agreement to update lease dates.
                    </span>
                  </div>
                )}
              </div>

              {/* Lease Agreement Upload/View/Delete Section */}
              {lease?.agreement_url ? (
                // If a lease agreement exists
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
                // If no lease agreement exists
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload Lease Agreement:
                  </p>
                  <LeaseUpload onFileUpload={handleFileUpload} />
                </div>
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
          {/* {maintenanceRequests && maintenanceRequests.length > 0 ? (
            <div className="divide-y">
              {maintenanceRequests.map((request) => (
                <div key={request.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {request.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        request.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Requested on: {request.date}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">
              No maintenance requests found
            </p>
          )} */}
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
      {/* Approve/Disapprove Buttons */}
      {status === "unoccupied" && prospectiveStatus === "pending" ? (
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition duration-300"
            onClick={() => updateTenantStatus("approved")}
          >
            Approve
          </button>
          <button
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition duration-300"
            onClick={() => updateTenantStatus("disapproved")}
          >
            Disapprove
          </button>
        </div>
      ) : status === "occupied" ? (
        <button
          className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 mt-6"
          onClick={toggleUnitStatus}
        >
          Mark as Unoccupied
        </button>
      ) : null}
    </div>
  );
};

export default LeaseDetails;
