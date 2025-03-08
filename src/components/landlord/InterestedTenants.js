"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  AiOutlineArrowLeft,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineLock
} from "react-icons/ai";
import Swal from "sweetalert2";
import LoadingScreen from "../../components/loadingScreen";
import Image from "next/image";
import useAuth from "@/hooks/useSession"; // Added import

export default function InterestedTenants({ unitId, landlordId }) {
  const router = useRouter();
  const { user } = useAuth(); // Get user from auth context
  const [tenants, setTenants] = useState([]);
  const [visibleTenants, setVisibleTenants] = useState([]);
  const [hiddenTenants, setHiddenTenants] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch subscription data and tenants from the API
  useEffect(() => {
    const fetchData = async () => {
      if (!landlordId) {
        console.error("Missing landlordId");
        setError("Missing landlord ID. Please try again later.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get subscription from user data if available
        if (user && user.subscription) {
          setSubscription({
            ...user.subscription,
            plan_name: user.subscription.plan_name || "Free Plan",
            listingLimits: {
              maxProspect: user.subscription.plan_name === "Premium Plan" ? Infinity : 3
            }
          });
        } else {
          // Otherwise fetch it (fallback)
          const subscriptionResponse = await axios.get(
            `/api/landlord/getSubscription?landlord_id=${landlordId}`
          );
          const subscriptionData = subscriptionResponse.data;
          setSubscription(subscriptionData);
        }
        
        // Fetch tenants data
        const tenantsResponse = await axios.get(
          `/api/landlord/prospective/interested-tenants?unitId=${unitId}`
        );
        const tenantsData = tenantsResponse.data;
        setTenants(tenantsData);
        
        // Apply subscription limits
        const maxProspects = subscription?.listingLimits?.maxProspect || 3;
        
        if (maxProspects === Infinity) {
          // Premium plan - show all tenants
          setVisibleTenants(tenantsData);
          setHiddenTenants([]);
        } else {
          // Free or Standard plan - limit the number of visible tenants
          setVisibleTenants(tenantsData.slice(0, maxProspects));
          setHiddenTenants(tenantsData.slice(maxProspects));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [unitId, landlordId, user]);

  const handleUpgradeClick = () => {
    Swal.fire({
      title: 'Upgrade Your Plan',
      text: 'Upgrade to our Premium plan to see all prospective tenants!',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Upgrade Now',
      cancelButtonText: 'Maybe Later'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/pages/landlord/subscription'); // Navigate to subscription page
      }
    });
  };

  if (loading) return <LoadingScreen />;
  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            onClick={() => router.back()}
          >
            <AiOutlineArrowLeft className="text-xl" />
            <span className="font-medium">Back to Properties</span>
          </button>
          <h2 className="text-3xl font-bold text-blue-600">
            Prospective Tenants
          </h2>
        </div>

        {/* Subscription Info Banner */}
        {subscription && (
          <div className={`mb-6 p-4 rounded-lg ${subscription.plan_name === "Premium Plan" ? "bg-blue-50 border border-blue-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {subscription.plan_name === "Premium Plan" 
                    ? "Premium Plan: Unlimited prospective tenants" 
                    : `${subscription.plan_name}: ${subscription.listingLimits.maxProspect} prospective tenants`}
                </p>
                <p className="text-sm text-gray-600">
                  {hiddenTenants.length > 0 && `${hiddenTenants.length} additional prospective tenant${hiddenTenants.length > 1 ? 's' : ''} hidden`}
                </p>
              </div>
              {hiddenTenants.length > 0 && (
                <button 
                  onClick={handleUpgradeClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Status Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-gray-500">
                Visible Applicants:{" "}
                <span className="text-gray-900 ml-1">{visibleTenants.length}</span>
                {hiddenTenants.length > 0 && (
                  <span className="text-amber-600 ml-1">
                    (+{hiddenTenants.length} hidden)
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-500">
                Approved:{" "}
                <span className="text-green-600 ml-1">
                  {visibleTenants.filter((t) => t.status === "approved").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Pending:{" "}
                <span className="text-amber-600 ml-1">
                  {visibleTenants.filter((t) => t.status === "pending").length}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-500">
                Disapproved:{" "}
                <span className="text-red-600 ml-1">
                  {visibleTenants.filter((t) => t.status === "disapproved").length}
                </span>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleTenants.map((tenant) => (
                  <tr
                    key={tenant?.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          src={
                            tenant?.profilePicture ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Tenant Profile"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                        />
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => {
                        router.push(
                          `/pages/landlord/property-listing/view-unit/view-tenant/${unitId}`
                        );
                      }}
                    >
                      <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                        {tenant?.firstName} {tenant?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {tenant?.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          tenant?.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : tenant?.status === "disapproved"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {tenant?.status?.charAt(0).toUpperCase() +
                          tenant?.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Hidden tenants (blurred out) */}
                {hiddenTenants.length > 0 && hiddenTenants.slice(0, 3).map((tenant, index) => (
                  <tr
                    key={`hidden-${index}`}
                    className="hover:bg-gray-50 transition-colors duration-150 opacity-50 cursor-not-allowed"
                    onClick={handleUpgradeClick}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-12 w-12 relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full z-10">
                          <AiOutlineLock className="text-gray-500 text-xl" />
                        </div>
                        <Image
                          src={
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Locked Profile"
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover blur-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap blur-sm">
                      <div className="font-medium text-blue-600">
                        Tenant Name
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 blur-sm">
                      email@example.com
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 blur-sm">
                      (XXX) XXX-XXXX
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 blur-sm">
                      123 Example St
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap blur-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Locked
                      </span>
                    </td>
                  </tr>
                ))}
                
                {hiddenTenants.length > 3 && (
                  <tr
                    className="bg-gray-50 cursor-pointer"
                    onClick={handleUpgradeClick}
                  >
                    <td colSpan="6" className="px-6 py-4 text-center text-blue-600 font-medium">
                      + {hiddenTenants.length - 3} more hidden tenants. Upgrade to Premium to see all.
                    </td>
                  </tr>
                )}
                
                {visibleTenants.length === 0 && hiddenTenants.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No prospective tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}