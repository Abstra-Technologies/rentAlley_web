"use client";
import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import usePropertyStore from "../../../../zustand/propertyStore";
import useAuth from "../../../../../hooks/useSession";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  BuildingOffice2Icon, 
  HomeIcon, 
  PlusCircleIcon, 
  PencilSquareIcon, 
  TrashIcon,
  MapPinIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PropertyListingPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, fetchAllProperties, loading, error } = usePropertyStore();
  const [isVerified, setIsVerified] = useState(null);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [isFetchingVerification, setIsFetchingVerification] = useState(true);
  const [fetchingSubscription, setFetchingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user?.landlord_id) {
      console.log("Landlord ID:", user.landlord_id);
      fetchAllProperties(user.landlord_id);
    }
  }, [user?.landlord_id]);

  useEffect(() => {
    if (user?.userType === "landlord") {
      setIsVerified(null);
      setIsFetchingVerification(true);

      axios
        .get(`/api/landlord/verification-status?user_id=${user.user_id}`)
        .then((response) => {
          console.log("✅ Fetched Verification Status:", response.data);
          setIsVerified(response.data.is_verified);
        })
        .catch((err) => {
          console.error("Failed to fetch landlord verification status:", err);
        })
        .finally(() => {
          setIsFetchingVerification(false);
        });

      setFetchingSubscription(true);
      axios
        .get(`/api/subscription/getCurrentPlan/${user.landlord_id}`)
        .then((response) => {
          setSubscription(response.data);
        })
        .catch((err) => {
          console.error(" Failed to fetch subscription:", err);
        })
        .finally(() => setFetchingSubscription(false));
    }
  }, [user]);

  const handleEdit = (propertyId, event) => {
    event.stopPropagation();
    router.push(`../landlord/property-listing/edit-property/${propertyId}`);
  };

  const handleView = useCallback((property, event) => {
    event.stopPropagation();
    router.push(
      `/pages/landlord/property-listing/view-unit/${property.property_id}`
    );
  });

  const handleAddProperty = () => {
    if (!isVerified) {
      setShowVerifyPopup(true);
      return;
    }

    if (
      subscription &&
      properties.length >= subscription.listingLimits.maxProperties
    ) {
      Swal.fire(
        "Property Limit Reached",
        `You have reached the maximum property limit (${subscription.listingLimits.maxProperties}) for your plan.`,
        "error"
      );
      return;
    }
    router.push(`/pages/landlord/property-listing/create-property`);
  };

  const handleDelete = useCallback(async (propertyId, event) => {
    event.stopPropagation();

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `/api/propertyListing/propListing?id=${propertyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        Swal.fire({
          title: "Deleted!",
          text: "Property has been deleted.",
          icon: "success",
          showConfirmButton: true,
          confirmButtonText: "Close",
        }).then(() => {
          fetchAllProperties(user.landlord_id);
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Failed to delete property.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      Swal.fire({
        title: "Error!",
        text: "An error occurred while deleting the property.",
        icon: "error",
      });
    }
  });

  if (!user?.landlord_id) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  if (error) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">
                Property Listings
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {subscription && (
                <p className="text-gray-600 text-sm hidden md:block">
                  <span className="font-medium">{properties.length}/{subscription.listingLimits.maxProperties}</span> properties used
                </p>
              )}
              <button
                className={`flex items-center px-4 py-2 rounded-md font-bold transition-colors ${
                  isFetchingVerification
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : isVerified
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
                onClick={handleAddProperty}
                disabled={isFetchingVerification || !isVerified}
              >
                {isFetchingVerification ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                  </span>
                ) : (
                  <>
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add New Property
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            Manage your property listings and units
          </p>
        </div>

        {/* Alerts Section */}
        {subscription &&
          properties.length >= subscription.listingLimits.maxProperties && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
                <div>
                  <p className="font-bold text-red-700">Property Limit Reached</p>
                  <p className="text-sm text-red-600">You have reached your max property listing limit. Please upgrade your plan to list more properties.</p>
                </div>
              </div>
            </div>
          )}

        {!isFetchingVerification && !isVerified && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <p className="font-bold text-red-700">Verification Required</p>
                <p className="text-sm text-red-600">You must verify your account before listing a property.</p>
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    <HomeIcon className="h-5 w-5 mr-2 text-blue-600" /> 
    Your Properties
  </h2>
  
  {properties.length === 0 ? (
    // Empty state remains the same
    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      {/* ... */}
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property?.property_id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col"
        >
          {/* Property Image - Fixed height */}
          <div 
            className="h-48 cursor-pointer"
            onClick={(event) => handleView(property, event)}
          >
            {property.photos.length > 0 ? (
              <Image
                src={property.photos[0].photo_url}
                alt={property.property_name}
                width={400}
                height={250}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <BuildingOffice2Icon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Property Details - Flex grow to fill space */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="mb-2 flex-1">
              {/* Truncate long text */}
              <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                {property?.property_name}
              </h3>
              <div className="flex items-start text-gray-600 text-sm mb-2">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <p className="line-clamp-2">
                  {property?.street}, {property?.city},{" "}
                  {property?.province
                    .split("_")
                    .map(
                      (word) => word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")}{" "}
                </p>
              </div>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {property?.property_type.charAt(0).toUpperCase() +
                  property?.property_type.slice(1)}
              </span>
            </div>
            
            {/* Action buttons at the bottom */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="flex justify-between">
                <button
                  className="flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  onClick={(event) => handleView(property, event)}
                >
                  <HomeIcon className="h-4 w-4 mr-1" />
                  View Units
                </button>
                
                <div className="flex space-x-2">
                  <button
                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    onClick={(event) => handleEdit(property?.property_id, event)}
                    aria-label="Edit property"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    onClick={(event) => handleDelete(property?.property_id, event)}
                    aria-label="Delete property"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        
        {/* Verification Popup */}
        {showVerifyPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
              <ExclamationCircleIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Verification Required</h3>
              <p className="text-gray-600 mb-6">
                You need to verify your account before adding a property.
              </p>
              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                onClick={() => setShowVerifyPopup(false)}
              >
                I Understand
              </button>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
};

export default PropertyListingPage;






// "use client";
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
// import usePropertyStore from "../../../../zustand/propertyStore";
// import useAuth from "../../../../../hooks/useSession";
// import axios from "axios";
// import Swal from "sweetalert2";
// import PropertyCard from "../../../../components/properties/PropertyCard";
// import VerificationPopup from "../../../../components/common/VerificationPopup";
// import { Plus, Loader2, Filter, Search } from "lucide-react";

// const PropertyListingPage = () => {
//   const router = useRouter();
//   const { user } = useAuth();
//   const { properties, fetchAllProperties, loading, error } = usePropertyStore();
//   const [isVerified, setIsVerified] = useState(null);
//   const [showVerifyPopup, setShowVerifyPopup] = useState(false);
//   const [isFetchingData, setIsFetchingData] = useState(true);
//   const [subscription, setSubscription] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [filterOptions, setFilterOptions] = useState({
//     status: "all",
//     propertyType: "all",
//   });

//   useEffect(() => {
//     if (!user?.landlord_id) return;
    
//     console.log("Landlord ID:", user.landlord_id);
//     fetchAllProperties(user.landlord_id);
    
//     const fetchLandlordData = async () => {
//       setIsFetchingData(true);
//       try {
//         // Fetch both verification status and subscription in parallel
//         const [verificationRes, subscriptionRes] = await Promise.all([
//           axios.get(`/api/landlord/verification-status?user_id=${user.user_id}`),
//           axios.get(`/api/subscription/getCurrentPlan/${user.landlord_id}`)
//         ]);
        
//         setIsVerified(verificationRes.data.is_verified);
//         setSubscription(subscriptionRes.data);
//       } catch (err) {
//         console.error("Failed to fetch landlord data:", err);
//       } finally {
//         setIsFetchingData(false);
//       }
//     };
    
//     fetchLandlordData();
//   }, [user]);

//   const handleAddProperty = () => {
//     if (!isVerified) {
//       setShowVerifyPopup(true);
//       return;
//     }

//     if (subscription && properties.length >= subscription.listingLimits.maxProperties) {
//       Swal.fire({
//         title: 'Limit Reached',
//         text: `You have reached the maximum property limit (${subscription.listingLimits.maxProperties}) for your plan.`,
//         icon: 'warning',
//         confirmButtonText: 'Okay'
//       });
//       return;
//     }
//     router.push(`/pages/landlord/property-listing/create-property`);
//   };
  
//   const handleEdit = (propertyId) => {
//     router.push(`../landlord/property-listing/edit-property/${propertyId}`);
//   };

//   const handleView = (property) => {
//     router.push(`../landlord/property-listing/view-unit/${property.property_id}`);
//   };

//   const handleTenantRequest = (propertyId) => {
//     router.push(`/pages/landlord/property-listing/tenant-req/${propertyId}`);
//   };

//   const handleDelete = async (propertyId) => {
//     // Show confirmation popup
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be able to recover this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       const response = await fetch(
//         `/api/propertyListing/propListing?id=${propertyId}`,
//         { method: "DELETE" }
//       );

//       if (response.ok) {
//         Swal.fire({
//           title: "Deleted!",
//           text: "Property has been deleted.",
//           icon: "success",
//           showConfirmButton: true,
//           confirmButtonText: "Close",
//         }).then(() => {
//           fetchAllProperties(user.landlord_id);
//         });
//       } else {
//         Swal.fire({
//           title: "Error!",
//           text: "Failed to delete property.",
//           icon: "error",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting property:", error);
//       Swal.fire({
//         title: "Error!",
//         text: "An error occurred while deleting the property.",
//         icon: "error",
//       });
//     }
//   };

//   const toggleFilter = () => {
//     setFilterOpen(!filterOpen);
//   };

//   const applyFilter = (e) => {
//     e.preventDefault();
//     // The actual filtering will be done in the filteredProperties computation
//     setFilterOpen(false);
//   };

//   const filteredProperties = properties.filter((property) => {
//     // Apply search term filter
//     const searchMatch = 
//       property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       property.property_address.toLowerCase().includes(searchTerm.toLowerCase());
      
//     // Apply status filter if not "all"
//     const statusMatch = 
//       filterOptions.status === "all" || 
//       property.status === filterOptions.status;
      
//     // Apply property type filter if not "all"
//     const typeMatch = 
//       filterOptions.propertyType === "all" || 
//       property.property_type === filterOptions.propertyType;
      
//     return searchMatch && statusMatch && typeMatch;
//   });

//   if (!user?.landlord_id) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//         <p className="ml-2 text-lg text-gray-700">Loading...</p>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//         <p className="ml-2 text-lg text-gray-700">Fetching properties...</p>
//       </div>
//     );
//   }
    
//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <div className="p-6 bg-white shadow-lg rounded-lg max-w-md w-full text-center">
//           <p className="text-lg text-red-500 font-medium">{error}</p>
//           <button 
//             onClick={() => fetchAllProperties(user.landlord_id)}
//             className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <LandlordLayout>
//       <div className="flex-1">
//         {/* Header Section */}
//         <div className="sticky top-0 z-10 bg-white shadow-md">
//           <div className="p-4 sm:p-6">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//               <h2 className="text-xl font-bold text-gray-800">Property Listings</h2>
              
//               {/* Subscription info */}
//               {subscription && (
//                 <div className="bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-700 font-medium">
//                   {`${properties.length}/${subscription.listingLimits.maxProperties} Properties`}
//                 </div>
//               )}
              
//               {/* Add Property Button */}
//               <button
//                 className={`
//                   flex items-center px-4 py-2 rounded-md font-medium shadow-sm
//                   ${isFetchingData
//                     ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                     : isVerified
//                     ? "bg-blue-600 text-white hover:bg-blue-700"
//                     : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                   }
//                   transition-colors duration-200
//                 `}
//                 onClick={handleAddProperty}
//                 disabled={isFetchingData || !isVerified}
//               >
//                 {isFetchingData ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     <span>Checking...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Plus className="h-4 w-4 mr-2" />
//                     <span>Add Property</span>
//                   </>
//                 )}
//               </button>
//             </div>
            
//             {/* Search and Filter Section */}
//             <div className="mt-4 flex flex-col sm:flex-row gap-3">
//               {/* Search Bar */}
//               <div className="relative flex-1">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search properties..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
//                 />
//               </div>
              
//               {/* Filter Button */}
//               <button
//                 onClick={toggleFilter}
//                 className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition duration-200"
//               >
//                 <Filter className="h-4 w-4 mr-2" />
//                 <span>Filter</span>
//               </button>
//             </div>
            
//             {/* Filter Panel - Conditional Render */}
//             {filterOpen && (
//               <div className="mt-3 p-4 bg-white border rounded-lg shadow-md">
//                 <form onSubmit={applyFilter}>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Status
//                       </label>
//                       <select
//                         value={filterOptions.status}
//                         onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
//                         className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         <option value="all">All Statuses</option>
//                         <option value="available">Available</option>
//                         <option value="occupied">Occupied</option>
//                         <option value="maintenance">Under Maintenance</option>
//                       </select>
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Property Type
//                       </label>
//                       <select
//                         value={filterOptions.propertyType}
//                         onChange={(e) => setFilterOptions({...filterOptions, propertyType: e.target.value})}
//                         className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         <option value="all">All Types</option>
//                         <option value="apartment">Apartment</option>
//                         <option value="house">House</option>
//                         <option value="condo">Condo</option>
//                         <option value="commercial">Commercial</option>
//                       </select>
//                     </div>
//                   </div>
                  
//                   <div className="mt-4 flex justify-end space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setFilterOptions({ status: "all", propertyType: "all" });
//                         setFilterOpen(false);
//                       }}
//                       className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
//                     >
//                       Reset
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
//                     >
//                       Apply Filters
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {/* Properties List */}
//         <div className="p-4 sm:p-6">
//           {filteredProperties.length === 0 ? (
//             <div className="mt-6 text-center p-8 bg-white rounded-lg shadow-sm">
//               <div className="mb-4">
//                 <Building className="h-12 w-12 mx-auto text-gray-400" />
//               </div>
//               <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
//               <p className="mt-1 text-gray-500">
//                 {properties.length > 0 
//                   ? "Try adjusting your search or filters to see more results." 
//                   : "Add your first property to get started."}
//               </p>
//               {properties.length === 0 && isVerified && (
//                 <button
//                   onClick={handleAddProperty}
//                   className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
//                 >
//                   Add Your First Property
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
//               {filteredProperties.map((property) => (
//                 <PropertyCard
//                   key={property.property_id}
//                   property={property}
//                   onView={() => handleView(property)}
//                   onEdit={() => handleEdit(property.property_id)}
//                   onDelete={() => handleDelete(property.property_id)}
//                   onTenantRequest={() => handleTenantRequest(property.property_id)}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
        
//         {showVerifyPopup && (
//           <VerificationPopup onClose={() => setShowVerifyPopup(false)} />
//         )}
//       </div>
//     </LandlordLayout>
//   );
// };

// export default PropertyListingPage;










// "use client";
// import React, { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
// import usePropertyStore from "../../../../zustand/propertyStore";
// import useAuth from "../../../../../hooks/useSession";
// import axios from "axios";
// import Swal from "sweetalert2";
// import PropertyCard from "../../../../components/properties/PropertyCard";
// import VerificationPopup from "../../../../components/common/VerificationPopup";
// import { Plus, Loader2, Filter, Search, Building, ArrowLeft, ArrowRight } from "lucide-react";

// const PropertyListingPage = () => {
//   const router = useRouter();
//   const { user } = useAuth();
//   const { properties, fetchAllProperties, loading, error } = usePropertyStore();
//   const [isVerified, setIsVerified] = useState(null);
//   const [showVerifyPopup, setShowVerifyPopup] = useState(false);
//   const [isFetchingData, setIsFetchingData] = useState(true);
//   const [subscription, setSubscription] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [filterOptions, setFilterOptions] = useState({
//     status: "all",
//     propertyType: "all",
//     sortBy: "newest"
//   });
  
//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 6;

//   useEffect(() => {
//     if (!user?.landlord_id) return;
    
//     console.log("Landlord ID:", user.landlord_id);
//     fetchAllProperties(user.landlord_id);
    
//     const fetchLandlordData = async () => {
//       setIsFetchingData(true);
//       try {
//         // Fetch both verification status and subscription in parallel
//         const [verificationRes, subscriptionRes] = await Promise.all([
//           axios.get(`/api/landlord/verification-status?user_id=${user.user_id}`),
//           axios.get(`/api/subscription/getCurrentPlan/${user.landlord_id}`)
//         ]);
        
//         setIsVerified(verificationRes.data.is_verified);
//         setSubscription(subscriptionRes.data);
//       } catch (err) {
//         console.error("Failed to fetch landlord data:", err);
//       } finally {
//         setIsFetchingData(false);
//       }
//     };
    
//     fetchLandlordData();
//   }, [user]);
  
//   // Reset to first page when search or filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, filterOptions]);

//   const handleAddProperty = () => {
//     if (!isVerified) {
//       setShowVerifyPopup(true);
//       return;
//     }

//     if (subscription && properties.length >= subscription.listingLimits.maxProperties) {
//       Swal.fire({
//         title: 'Limit Reached',
//         text: `You have reached the maximum property limit (${subscription.listingLimits.maxProperties}) for your plan.`,
//         icon: 'warning',
//         confirmButtonText: 'Okay'
//       });
//       return;
//     }
//     router.push(`/pages/landlord/property-listing/create-property`);
//   };
  
//   const handleEdit = (propertyId) => {
//     router.push(`../landlord/property-listing/edit-property/${propertyId}`);
//   };

//   const handleView = (property) => {
//     router.push(`../landlord/property-listing/view-unit/${property.property_id}`);
//   };

//   const handleTenantRequest = (propertyId) => {
//     router.push(`/pages/landlord/property-listing/tenant-req/${propertyId}`);
//   };

//   const handleDelete = async (propertyId) => {
//     // Show confirmation popup
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be able to recover this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       const response = await fetch(
//         `/api/propertyListing/propListing?id=${propertyId}`,
//         { method: "DELETE" }
//       );

//       if (response.ok) {
//         Swal.fire({
//           title: "Deleted!",
//           text: "Property has been deleted.",
//           icon: "success",
//           showConfirmButton: true,
//           confirmButtonText: "Close",
//         }).then(() => {
//           fetchAllProperties(user.landlord_id);
//         });
//       } else {
//         Swal.fire({
//           title: "Error!",
//           text: "Failed to delete property.",
//           icon: "error",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting property:", error);
//       Swal.fire({
//         title: "Error!",
//         text: "An error occurred while deleting the property.",
//         icon: "error",
//       });
//     }
//   };

//   const toggleFilter = () => {
//     setFilterOpen(!filterOpen);
//   };

//   const applyFilter = (e) => {
//     e.preventDefault();
//     setFilterOpen(false);
//   };

//   // Sort and filter properties
//   const filteredProperties = properties
//     .filter((property) => {
//       // Apply search term filter
//       const searchMatch = 
//         property.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         property.property_address?.toLowerCase().includes(searchTerm.toLowerCase());
        
//       // Apply status filter if not "all"
//       const statusMatch = 
//         filterOptions.status === "all" || 
//         property.status === filterOptions.status;
        
//       // Apply property type filter if not "all"
//       const typeMatch = 
//         filterOptions.propertyType === "all" || 
//         property.property_type === filterOptions.propertyType;
        
//       return searchMatch && statusMatch && typeMatch;
//     })
//     .sort((a, b) => {
//       // Apply sort option
//       switch (filterOptions.sortBy) {
//         case "newest":
//           return new Date(b.created_at || 0) - new Date(a.created_at || 0);
//         case "oldest":
//           return new Date(a.created_at || 0) - new Date(b.created_at || 0);
//         case "priceHighLow":
//           return (b.rent || 0) - (a.rent || 0);
//         case "priceLowHigh":
//           return (a.rent || 0) - (b.rent || 0);
//         default:
//           return 0;
//       }
//     });
    
//   // Calculate pagination
//   const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);
  
//   const paginate = (pageNumber) => {
//     setCurrentPage(pageNumber);
//     // Scroll to top of property listing
//     document.getElementById('property-grid').scrollIntoView({ behavior: 'smooth' });
//   };

//   if (!user?.landlord_id) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <div className="flex flex-col items-center space-y-3">
//           <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
//           <p className="text-lg text-gray-700 font-medium">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <div className="flex flex-col items-center space-y-3">
//           <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
//           <p className="text-lg text-gray-700 font-medium">Fetching properties...</p>
//         </div>
//       </div>
//     );
//   }
    
//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <div className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full text-center">
//           <div className="inline-flex h-14 w-14 rounded-full bg-red-50 p-4 mb-4">
//             <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Properties</h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button 
//             onClick={() => fetchAllProperties(user.landlord_id)}
//             className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <LandlordLayout>
//       <div className="flex-1">
//         {/* Header Section */}
//         <div className="sticky top-0 z-10 bg-white shadow-md">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">Property Listings</h2>
//                 <p className="text-sm text-gray-500 mt-1">Manage your rental properties</p>
//               </div>
              
//               <div className="flex items-center gap-4">
//                 {/* Subscription info */}
//                 {subscription && (
//                   <div className="hidden sm:flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-full">
//                     <span className="text-xs text-blue-600 font-medium">
//                       {`${properties.length}/${subscription.listingLimits.maxProperties}`}
//                     </span>
//                     <span className="text-xs text-blue-500">Properties</span>
//                   </div>
//                 )}
                
//                 {/* Add Property Button */}
//                 <button
//                   className={`
//                     inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm
//                     ${isFetchingData
//                       ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       : isVerified
//                       ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//                       : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                     }
//                     transition-colors duration-200
//                   `}
//                   onClick={handleAddProperty}
//                   disabled={isFetchingData || !isVerified}
//                 >
//                   {isFetchingData ? (
//                     <>
//                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                       <span>Checking...</span>
//                     </>
//                   ) : (
//                     <>
//                       <Plus className="h-4 w-4 mr-2" />
//                       <span>Add Property</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
            
//             {/* Search and Filter Section */}
//             <div className="mt-6 flex flex-col sm:flex-row gap-3">
//               {/* Search Bar */}
//               <div className="relative flex-1">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search properties by name or address..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
//                 />
//               </div>
              
//               {/* Filter Button */}
//               <button
//                 onClick={toggleFilter}
//                 className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 <Filter className="h-4 w-4 mr-2" />
//                 <span>Filters</span>
//               </button>
//             </div>
            
//             {/* Filter Panel - Conditional Render */}
//             {filterOpen && (
//               <div className="mt-4 p-5 bg-white border border-gray-200 rounded-lg shadow-lg">
//                 <form onSubmit={applyFilter}>
//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Status
//                       </label>
//                       <select
//                         value={filterOptions.status}
//                         onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
//                         className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         <option value="all">All Statuses</option>
//                         <option value="available">Available</option>
//                         <option value="occupied">Occupied</option>
//                         <option value="maintenance">Under Maintenance</option>
//                       </select>
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Property Type
//                       </label>
//                       <select
//                         value={filterOptions.propertyType}
//                         onChange={(e) => setFilterOptions({...filterOptions, propertyType: e.target.value})}
//                         className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         <option value="all">All Types</option>
//                         <option value="apartment">Apartment</option>
//                         <option value="house">House</option>
//                         <option value="condo">Condo</option>
//                         <option value="commercial">Commercial</option>
//                       </select>
//                     </div>
                    
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Sort By
//                       </label>
//                       <select
//                         value={filterOptions.sortBy}
//                         onChange={(e) => setFilterOptions({...filterOptions, sortBy: e.target.value})}
//                         className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         <option value="newest">Newest First</option>
//                         <option value="oldest">Oldest First</option>
//                         <option value="priceHighLow">Price: High to Low</option>
//                         <option value="priceLowHigh">Price: Low to High</option>
//                       </select>
//                     </div>
//                   </div>
                  
//                   <div className="mt-6 flex justify-end space-x-3">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setFilterOptions({ 
//                           status: "all", 
//                           propertyType: "all",
//                           sortBy: "newest" 
//                         });
//                       }}
//                       className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
//                     >
//                       Reset
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
//                     >
//                       Apply Filters
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {/* Properties List */}
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           {/* Properties Count */}
//           <div className="flex justify-between items-center mb-6">
//             <div className="text-sm text-gray-700">
//               {filteredProperties.length === 0 
//                 ? 'No properties found' 
//                 : `Showing ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredProperties.length)} of ${filteredProperties.length} properties`
//               }
//             </div>
            
//             {subscription && filteredProperties.length > 0 && (
//               <div className="sm:hidden flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-full">
//                 <span className="text-xs text-blue-600 font-medium">
//                   {`${properties.length}/${subscription.listingLimits.maxProperties}`}
//                 </span>
//                 <span className="text-xs text-blue-500">Properties</span>
//               </div>
//             )}
//           </div>
          
//           {filteredProperties.length === 0 ? (
//             <div className="mt-6 text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
//               <div className="mb-6 inline-flex p-3 bg-blue-50 rounded-full">
//                 <Building className="h-12 w-12 text-blue-500" />
//               </div>
//               <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
//               <p className="text-gray-500 max-w-md mx-auto">
//                 {properties.length > 0 
//                   ? "Try adjusting your search or filters to see more results." 
//                   : "Add your first property to get started managing your rentals."}
//               </p>
//               {properties.length === 0 && isVerified && (
//                 <button
//                 onClick={handleAddProperty}
//                 className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
//               >
//                 <Plus className="inline-block h-4 w-4 mr-2" />
//                 Add Your First Property
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             <div id="property-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {currentItems.map((property) => (
//                 <PropertyCard
//                   key={property.property_id}
//                   property={property}
//                   onView={() => handleView(property)}
//                   onEdit={() => handleEdit(property.property_id)}
//                   onDelete={() => handleDelete(property.property_id)}
//                   onTenantRequest={() => handleTenantRequest(property.property_id)}
//                 />
//               ))}
//             </div>
            
//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="mt-8 flex justify-center">
//                 <nav className="flex items-center space-x-2">
//                   <button
//                     onClick={() => paginate(currentPage - 1)}
//                     disabled={currentPage === 1}
//                     className={`p-2 rounded-md ${
//                       currentPage === 1
//                         ? "text-gray-300 cursor-not-allowed"
//                         : "text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ArrowLeft className="h-5 w-5" />
//                   </button>
                  
//                   {[...Array(totalPages)].map((_, index) => {
//                     const pageNumber = index + 1;
//                     // Show first page, last page, current page, and pages immediately adjacent to current page
//                     if (
//                       pageNumber === 1 ||
//                       pageNumber === totalPages ||
//                       (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
//                     ) {
//                       return (
//                         <button
//                           key={pageNumber}
//                           onClick={() => paginate(pageNumber)}
//                           className={`px-4 py-2 rounded-md ${
//                             currentPage === pageNumber
//                               ? "bg-blue-600 text-white font-medium"
//                               : "text-gray-700 hover:bg-gray-100"
//                           }`}
//                         >
//                           {pageNumber}
//                         </button>
//                       );
//                     } else if (
//                       (pageNumber === 2 && currentPage > 3) ||
//                       (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
//                     ) {
//                       return (
//                         <span
//                           key={pageNumber}
//                           className="px-4 py-2 text-gray-500"
//                         >
//                           ...
//                         </span>
//                       );
//                     }
//                     return null;
//                   })}
                  
//                   <button
//                     onClick={() => paginate(currentPage + 1)}
//                     disabled={currentPage === totalPages}
//                     className={`p-2 rounded-md ${
//                       currentPage === totalPages
//                         ? "text-gray-300 cursor-not-allowed"
//                         : "text-gray-700 hover:bg-gray-100"
//                     }`}
//                   >
//                     <ArrowRight className="h-5 w-5" />
//                   </button>
//                 </nav>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
    
//     {/* Verification Popup */}
//     {showVerifyPopup && (
//       <VerificationPopup
//         isOpen={showVerifyPopup}
//         onClose={() => setShowVerifyPopup(false)}
//         userId={user?.user_id}
//       />
//     )}
//   </LandlordLayout>
// );
// };

// export default PropertyListingPage;