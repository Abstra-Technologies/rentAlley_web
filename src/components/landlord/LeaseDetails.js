"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import LeaseUpload from "./LeaseUpload";
import Image from "next/image";
import Swal from "sweetalert2";

const LeaseDetails = ({ propertyId, unitId }) => {
  const [lease, setLease] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLeaseDetails();
    fetchTenantDetails();
  }, []);

  // Fetch lease details
  const fetchLeaseDetails = async () => {
    try {
      const response = await axios.get(
        `/api/leaseAgreement/getLease?property_id=${propertyId}&unit_id=${unitId}`
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
    formData.append("property_id", propertyId);
    formData.append("unit_id", unitId);

    try {
      await axios.post(
        `/api/leaseAgreement/uploadLease?property_id=${propertyId}&unit_id=${unitId}`,
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
        `/api/landlord/prospective/interested-tenants?propertyId=${propertyId}&unitId=${unitId}`
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
      await axios.put(
        `/api/leaseAgreement/leaseDetails?property_id=${propertyId}&unit_id=${unitId}`,
        {
          start_date: startDate,
          end_date: endDate,
        }
      );
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
            `/api/leaseAgreement/deleteLease?property_id=${propertyId}&unit_id=${unitId}`
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
    <div className="flex flex-col md:flex-row gap-6 p-6">
      {/* Right Side: Tenant Details */}
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Tenant Details</h2>
        {tenant ? (
          <div className="flex flex-col items-center text-center">
            {/* Profile Picture */}
            {tenant.profilePicture && (
              <Image
                src={tenant.profilePicture}
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border shadow-md"
              />
            )}

            {/* Tenant Info */}
            <p className="mt-4 text-lg font-semibold">
              {tenant.firstName} {tenant.lastName}
            </p>
            <p className="text-gray-500">
              Birthdate: {tenant.birthDate.split("T")[0]}
            </p>
            <p className="text-gray-700 mt-2">Address:</p>
            <p className="text-gray-500">{tenant.current_home_address}</p>
            {/* Lease Info */}
            {lease && (
              <div className="mt-4 text-left bg-gray-100 p-4 rounded-lg shadow-md w-full">
                <h3 className="text-lg font-semibold text-center">
                  Lease Details
                </h3>
                <p className="text-gray-700 mt-2">
                  <strong>Start Date:</strong>{" "}
                  {startDate ? new Date(startDate).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-gray-700 mt-1">
                  <strong>End Date:</strong>{" "}
                  {endDate ? new Date(endDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            )}

            {/* Lease File Viewer */}
            {lease?.agreement_url && (
              <div className="mt-6 border p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold">
                  Lease Agreement Preview
                </h2>
                <a
                  href={lease.agreement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Lease Agreement
                </a>
              </div>
            )}
            {lease && (
              <button
                onClick={handleDeleteLease}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete Lease
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No tenant information available</p>
        )}
      </div>

      {/* Left Side: Government ID & Lease Upload */}
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Government ID</h2>
        {tenant?.government_id ? (
          <div className="border rounded-lg overflow-hidden shadow-md p-4">
            <Image
              src={tenant.government_id}
              alt="Government ID"
              width={400}
              height={250}
              className="w-full max-h-64 object-contain rounded-lg"
            />
          </div>
        ) : (
          <p className="text-gray-500">No government ID available</p>
        )}

        {/* Lease Upload Below */}
        <div className="mt-6 p-4 border rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Upload Lease Agreement</h2>
          <LeaseUpload onFileUpload={handleFileUpload} />
          {lease && (
            <div className="mt-4">
              <label className="block text-gray-700">Start Date:</label>
              <input
                type="date"
                className="border p-2 w-full rounded"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label className="block text-gray-700 mt-2">End Date:</label>
              <input
                type="date"
                className="border p-2 w-full rounded"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <button
                onClick={handleUpdateLease}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update Lease
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaseDetails;
