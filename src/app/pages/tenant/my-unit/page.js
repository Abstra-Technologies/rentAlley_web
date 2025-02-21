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
  IdentificationIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

export default function MyUnit() {
  const { user } = useAuth(); // Get user from auth context
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch unit data when component mounts and user is available
  useEffect(() => {
    const fetchUnitData = async () => {
      if (!user?.tenant_id) {
        setLoading(false);
        setError("Unable to retrieve tenant information from your account");
        return;
      }
      
      try {
        
        setLoading(true);
        
        const response = await axios.get(`/api/tenant/approved-tenant-property?tenantId=${user.tenant_id}`);
        console.log("API Response:", response.data);
        setUnit(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching unit data:", err);
        setError(err.response?.data?.message || "Failed to load unit information");
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUnitData();
    }
  }, [user]);

  const handlePayRent = () => {
    setLoadingPayment(true);
    
    // Determine which ID to pass based on what type of property is assigned
    const idToPass = unit.unit_id ? 
      { unitId: unit.unit_id, tenantId: user.tenant_id } : 
      { propertyId: unit.property_id, tenantId: user.tenant_id };
    
    // For demonstration - in real implementation you'd use router
    setTimeout(() => {
      setLoadingPayment(false);
      alert(`Redirecting to rent management system with ${JSON.stringify(idToPass)}`);
      // Router implementation would go here, e.g.:
      // router.push({
      //   pathname: '/rent-management',
      //   query: idToPass
      // });
    }, 800);
  };

  // Function to render amenities from JSON string (if stored that way in DB)
  const renderAmenities = (amenitiesData) => {
    let amenities = [];
    try {
      if (typeof amenitiesData === 'string') {
        amenities = JSON.parse(amenitiesData);
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
    if (!unit) return '';
    return `${unit.street || ''}, ${unit.city || ''}, ${unit.province || ''} ${unit.zip_code || ''}`.trim();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Loading your unit information...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="flex justify-center">
            <XCircleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="mt-4 text-center text-xl font-bold text-gray-900">Unable to Load Unit Information</h2>
          <p className="mt-2 text-center text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-md bg-indigo-600 py-2 px-4 font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="hidden w-64 border-r border-gray-200 bg-white py-6 px-6 md:block">
        <div className="mb-8 flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <UserCircleIcon className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-indigo-900">My Account</h2>
            {user?.tenant_id && <p className="text-sm text-gray-500">Tenant ID: {user.tenant_id}</p>}
          </div>
        </div>
        <nav>
          <ul className="space-y-3">
            <li className="rounded-md bg-indigo-50">
              <a href="#" className="flex items-center space-x-3 rounded-md p-3 font-medium text-indigo-900">
                <HomeIcon className="h-5 w-5" />
                <span>Current Unit</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center space-x-3 rounded-md p-3 text-gray-700 transition-colors duration-200 hover:bg-gray-100">
                <ClockIcon className="h-5 w-5" />
                <span>Unit History</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center space-x-3 rounded-md p-3 text-gray-700 transition-colors duration-200 hover:bg-gray-100">
                <CurrencyDollarIcon className="h-5 w-5" />
                <span>Payment History</span>
              </a>
            </li>
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
                {user?.tenant_id && <p className="text-xs text-gray-500">Tenant ID: {user.tenant_id}</p>}
              </div>
            </div>
            <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden bg-white shadow-sm md:block">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <HomeIcon className="mr-3 h-7 w-7 text-indigo-900" />
              <h1 className="text-2xl font-bold text-indigo-900">Current Unit</h1>
            </div>
            {user?.tenant_id && (
              <div className="flex items-center rounded-md bg-indigo-50 px-3 py-1 text-sm">
                <UserCircleIcon className="mr-1 h-4 w-4 text-indigo-700" />
                <span className="font-medium text-indigo-700">Tenant ID: {user.tenant_id}</span>
              </div>
            )}
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
                    src={unit.unit_photo || unit.property_photo || "/api/placeholder/500/400"}
                    alt={unit.unit_name || unit.property_name || "Property Image"}
                    layout="fill"
                    objectFit="cover"
                    className="h-full w-full"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                      {unit.property_type || "Residential"}
                    </span>
                  </div>
                </div>
                
                {/* Right: Unit Details */}
                <div className="p-6 md:w-1/2">
                  <div className="mb-6">
                    <h2 className="mb-2 text-2xl font-bold text-gray-800">
                      {unit.unit_name || unit.property_name}
                    </h2>
                    
                    <div className="mb-4 flex items-center text-sm text-gray-600">
                      <InformationCircleIcon className="mr-1 h-4 w-4" />
                      <span>{formatAddress(unit)}</span>
                    </div>
                    
                    {/* Property/Unit ID Badge */}
                    <div className="mb-4 inline-flex items-center rounded-md bg-blue-50 px-3 py-1">
                      <IdentificationIcon className="mr-1 h-4 w-4 text-blue-700" />
                      <span className="text-sm font-medium text-blue-700">
                        {unit.unit_id ? `Unit ID: ${unit.unit_id}` : `Property ID: ${unit.property_id}`}
                      </span>
                    </div>
                    
                    <p className="mb-6 line-clamp-4 text-gray-600">
                      {unit.description || "No description available"}
                    </p>
                    
                    <div className="mb-8 flex items-center">
                      <BuildingOfficeIcon className="mr-2 h-5 w-5 text-indigo-700" />
                      <span className="font-medium text-indigo-700">
                        {unit.unit_id ? "Individual Unit" : "Entire Property"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-8 space-y-4">
                    {unit.rent_payment && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Monthly Rent:</span>
                        <span className="text-lg font-bold">₱{parseFloat(unit.rent_payment).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {unit.status && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          {unit.status || "Current"}
                        </span>
                      </div>
                    )}
                    
                    {unit.floor_area && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Floor Area:</span>
                        <span className="text-gray-900">{unit.floor_area} sqm</span>
                      </div>
                    )}
                    
                    {unit.furnish && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Furnish Type:</span>
                        <span className="capitalize text-gray-900">{unit.furnish}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handlePayRent}
                    disabled={loadingPayment}
                    className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-700"
                  >
                    {loadingPayment ? (
                      <>
                        <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CurrencyDollarIcon className="mr-2 h-5 w-5" />
                        Proceed to Rent Management
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Additional Details Section */}
              {unit.amenities && (
                <div className="border-t border-gray-200 px-6 py-6">
                  <h3 className="mb-4 text-lg font-semibold">Amenities & Inclusions</h3>
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {renderAmenities(unit.amenities).map((amenity, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <CheckCircleIcon className="mr-2 h-5 w-5 text-green-600" />
                        {amenity}
                      </li>
                    ))}
                    {renderAmenities(unit.amenities).length === 0 && (
                      <li className="italic text-gray-500">No amenities information available</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Quick Actions Section */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Contact Landlord
                  </button>
                  
                  <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Report Issue
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