"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import LeaseUpload from "./LeaseUpload";

const LeaseDetails = ({ propertyId, unitId }) => {
  const [lease, setLease] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLeaseDetails();
  }, []);

  // Fetch lease details
  const fetchLeaseDetails = async () => {
    try {
      const response = await axios.get(
        `/api/leaseAgreement/getLease?property_id=${propertyId}&unit_id=${unitId}`
      );
      if (response.data) {
        setLease(response.data);
        setStartDate(response.data.start_date);
        setEndDate(response.data.end_date);
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
      alert("Lease agreement uploaded successfully");
      fetchLeaseDetails(); // Refresh lease details
    } catch (error) {
      console.error("Error uploading lease file:", error);
      alert("Failed to upload lease agreement");
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
      alert("Lease dates updated successfully");
      fetchLeaseDetails(); // Refresh data
    } catch (error) {
      console.error("Error updating lease:", error);
      alert("Failed to update lease dates");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Lease Agreement</h2>

      {/* File Upload Component */}
      <LeaseUpload onFileUpload={handleFileUpload} />

      {/* Lease Details Form */}
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
  );
};

export default LeaseDetails;
