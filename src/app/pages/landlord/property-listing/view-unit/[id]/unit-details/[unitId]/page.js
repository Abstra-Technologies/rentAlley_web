"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import LandlordLayout from "../../../../../../../../components/navigation/sidebar-landlord";
import { ArrowLeftIcon, DocumentTextIcon, HomeIcon, CalendarIcon, IdentificationIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const fetcher = (url) => axios.get(url).then((res) => res.data);

const UnitDetailsPage = () => {
  const { propertyId, unitId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");

  // Fetch unit details
  const { data: unit, error: unitError, isLoading: unitLoading } = useSWR(
    unitId ? `/api/unitListing/unit/${unitId}` : null,
    fetcher
  );

  // Fetch tenant details (if the unit is occupied)
  const { data: tenant, error: tenantError, isLoading: tenantLoading } = useSWR(
    unit?.status === "Occupied" ? `/api/tenants/${unitId}` : null,
    fetcher
  );

  // Fetch maintenance requests
  const { data: maintenanceRequests } = useSWR(
    unitId ? `/api/maintenance-requests/${unitId}` : null,
    fetcher
  );

  // Mock tenant data (remove this in production and use the actual tenant data)
  const mockTenant = {
    first_name: "Maria",
    last_name: "Sharma",
    date_of_birth: "05/13/01",
    email: "MariaBrianna6@gmail.com",
    phone: "+63 906-78261",
    address: "Street 123, Barangay 121, City, Metro Manila",
    lease_start_date: "01/01/2024",
    lease_end_date: "01/01/2025",
    id_doc: {
      type: "Gov ID/PDF",
      file_name: "ID-01.pdf",
      file_size: "219 KB" 
    }
  };

  // If there's no real tenant data, use the mock data (for development only)
  const tenantData = tenant || mockTenant;

  const handleBack = () => {
    router.back();
  };

  const handleUploadLeaseAgreement = () => {
    // Implementation for uploading lease agreement
    console.log("Upload lease agreement");
  };

  if (unitLoading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  if (unitError) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-500 text-center">Failed to load unit details. Please try again later.</p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto block"
            >
              Go Back
            </button>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Property
        </button>

        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-48 bg-gray-200 relative">
            {/* If you have a property image, use it here */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-6">
              <h1 className="text-white text-2xl font-bold">XYZ Residences</h1>
              <p className="text-white text-lg">Unit {unit?.unit_name || "706"}</p>
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
                  <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden flex-shrink-0">
                    {/* You can add a profile image here if available */}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {unit?.status === "Occupied" 
                        ? `${tenantData.first_name} ${tenantData.last_name}` 
                        : "No Tenant"}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Date of Birth: {tenantData.date_of_birth}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email Address:</p>
                      <p className="text-gray-800 font-medium">
                        {tenantData.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number:</p>
                      <p className="text-gray-800 font-medium">
                        {tenantData.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Address:</p>
                      <p className="text-gray-800 font-medium">
                        {tenantData.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lease Agreement Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Lease Agreement</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Move in date:</p>
                    <div className="mt-1 flex items-center">
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="text" 
                          value="01" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                        <input 
                          type="text" 
                          value="01" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                        <input 
                          type="text" 
                          value="2024" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">(MM/DD/YYYY)</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">End date:</p>
                    <div className="mt-1 flex items-center">
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="text" 
                          value="01" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                        <input 
                          type="text" 
                          value="01" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                        <input 
                          type="text" 
                          value="2025" 
                          readOnly
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">(MM/DD/YYYY)</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">View Attachments Below:</p>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-red-100 text-red-500 flex items-center justify-center mr-3">
                        <DocumentTextIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Gov ID/PDF</p>
                        <p className="text-xs text-gray-500">ID-01.pdf • 219 KB</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">UPLOAD LEASE AGREEMENT</p>
                  <button
                    onClick={handleUploadLeaseAgreement}
                    className="w-full py-3 border border-dashed border-blue-600 rounded-md text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    UPLOAD LEASE AGREEMENT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Maintenance Request History</h2>
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              <div className="divide-y">
                {maintenanceRequests.map((request) => (
                  <div key={request.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{request.title}</h3>
                        <p className="text-sm text-gray-600">{request.description}</p>
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
              <p className="text-gray-500 text-center py-6">No maintenance requests found</p>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tenant History</h2>
            <p className="text-gray-500 text-center py-6">
              No previous tenant history for this unit
            </p>
          </div>
        )}

        {/* Unit Status */}
        <div className="mt-6 flex justify-end">
          <button
            className={`px-6 py-2 rounded-md font-medium ${
              unit?.status === "Occupied"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {unit?.status || "Unoccupied"}
          </button>
        </div>
      </div>
    </LandlordLayout>
  );
};

export default UnitDetailsPage;