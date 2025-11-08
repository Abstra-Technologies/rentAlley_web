"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  Eye,
  Users,
  Mail,
  Phone,
  Building2,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

export default function InterestedTenants({ propertyId, landlordId }) {
  const router = useRouter();
  const { fetchSession, user } = useAuthStore();
  const [tenants, setTenants] = useState([]);
  const [visibleTenants, setVisibleTenants] = useState([]);
  const [hiddenTenants, setHiddenTenants] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     🔹 Fetch Property Details
     ===================================================== */
  useEffect(() => {
    if (!propertyId) return;

    const fetchPropertyDetails = async () => {
      try {
        const res = await axios.get(
          `/api/propertyListing/property/${propertyId}`
        );
        setPropertyDetails(res.data?.property || null);
      } catch (err) {
        console.error("Failed to load property details:", err);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  /* =====================================================
     🔹 Fetch Subscription + Prospective Tenants
     ===================================================== */
  useEffect(() => {
    if (!propertyId || !landlordId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Load subscription info
        if (user?.subscription) {
          const plan = user.subscription.plan_name || "Free Plan";
          setSubscription({
            ...user.subscription,
            plan_name: plan,
            listingLimits: {
              maxProspect: plan === "Premium Plan" ? Infinity : 3,
            },
          });
        }

        // Fetch tenants interested in any unit under this property
        const tenantsResponse = await axios.get(
          `/api/landlord/prospective/interestedTenants?propertyId=${propertyId}`
        );

        const tenantsData = tenantsResponse.data || [];
        setTenants(tenantsData);

        const maxProspects =
          user?.subscription?.plan_name === "Premium Plan" ? Infinity : 3;
        setVisibleTenants(
          maxProspects === Infinity
            ? tenantsData
            : tenantsData.slice(0, maxProspects)
        );
        setHiddenTenants(
          maxProspects === Infinity ? [] : tenantsData.slice(maxProspects)
        );
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, landlordId, user]);

  /* =====================================================
     🔹 Handlers
     ===================================================== */
  const handleTenantClick = (tenant) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to tenant details...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    router.push(
      `/pages/landlord/properties/${propertyId}/prospectives/details?tenant_id=${tenant.tenant_id}&unit_id=${tenant.unit_id}`
    );

    Swal.close();
  };

  const handleUpgradeClick = () => {
    Swal.fire({
      title: "Upgrade Your Plan",
      text: "Upgrade to our Premium Plan to see all prospective tenants!",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Upgrade Now",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/pages/landlord/subscription");
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "disapproved":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "disapproved":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  /* =====================================================
     🔹 Rendering Section
     ===================================================== */
  if (loading) return <LoadingScreen />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-24 lg:pt-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                Prospective Tenants
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Tenants who applied for units in this property
              </p>
            </div>
          </div>

          {propertyDetails && (
            <div className="mt-3 flex items-start gap-2 text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-700 block">
                  {propertyDetails.property_name}
                </span>
                <span className="text-gray-600 block sm:inline">
                  {propertyDetails.city}, {propertyDetails.province}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Info Banner */}
        {subscription && (
          <div
            className={`mb-4 sm:mb-6 rounded-lg border p-3 sm:p-4 ${
              subscription.plan_name === "Premium Plan"
                ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                  {subscription.plan_name === "Premium Plan"
                    ? "🎉 Premium Plan Active"
                    : subscription.plan_name}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                  {subscription.plan_name === "Premium Plan"
                    ? "You have unlimited access to all prospective tenants"
                    : `Viewing ${subscription.listingLimits.maxProspect} of ${tenants.length} tenants`}
                </p>
                {hiddenTenants.length > 0 && (
                  <p className="text-xs sm:text-sm text-amber-700 mt-1 font-medium">
                    {hiddenTenants.length} tenant(s) hidden — upgrade to view
                    all
                  </p>
                )}
              </div>
              {hiddenTenants.length > 0 && (
                <button
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm w-full sm:w-auto flex-shrink-0"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Showing {visibleTenants.length} of {tenants.length} total
                tenants
              </span>
            </div>
            <span className="text-xs sm:text-sm text-blue-600 font-medium">
              Property-wide view
            </span>
          </div>
        </div>

        {/* Tenant Cards - Mobile */}
        <div className="block lg:hidden space-y-3 mb-6">
          {visibleTenants.length > 0 ? (
            visibleTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  {/* Header with Profile */}
                  <div className="flex items-start gap-3 mb-3">
                    <Image
                      src={
                        tenant?.profilePicture ||
                        "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                      }
                      alt="Profile"
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1.5 break-words">
                        {tenant.firstName} {tenant.lastName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusStyle(
                            tenant.status
                          )}`}
                        >
                          {getStatusIcon(tenant.status)}
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 break-all">
                        {tenant.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tenant.phoneNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">
                        {tenant.unit_name || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleTenantClick(tenant)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-900 font-semibold text-base sm:text-lg mb-1">
                No Applications Yet
              </p>
              <p className="text-gray-500 text-sm">
                Tenants who apply for units in this property will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Tenant Table - Desktop */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Unit Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTenants.length > 0 ? (
                  visibleTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Tenant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={
                              tenant?.profilePicture ||
                              "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                            }
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-gray-200"
                          />
                          <span className="font-semibold text-gray-900 text-sm">
                            {tenant.firstName} {tenant.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {tenant.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {tenant.phoneNumber}
                          </div>
                        </div>
                      </td>

                      {/* Unit Applied */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900 text-sm">
                            {tenant.unit_name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                            tenant.status
                          )}`}
                        >
                          {getStatusIcon(tenant.status)}
                          {tenant.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleTenantClick(tenant)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg mb-1">
                          No Applications Yet
                        </p>
                        <p className="text-gray-500 text-sm">
                          Tenants who apply for units in this property will
                          appear here.
                        </p>
                      </div>
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
