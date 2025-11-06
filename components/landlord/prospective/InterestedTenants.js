"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import { AiOutlineArrowLeft, AiOutlineEye } from "react-icons/ai";
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
                const res = await axios.get(`/api/propertyListing/property/${propertyId}`);
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
            `/pages/landlord/properties/${propertyId}/prospectives/details?tenant_id=${tenant.tenant_id}`
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

    /* =====================================================
       🔹 Rendering Section
       ===================================================== */
    if (loading) return <LoadingScreen />;
    if (error)
        return (
            <div className="p-6 text-center text-red-600 font-medium">{error}</div>
        );

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <button
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                        onClick={() => router.back()}
                    >
                        <AiOutlineArrowLeft className="text-xl" />
                        <span className="font-medium">Back to Properties</span>
                    </button>

                    <div className="text-center sm:text-right">
                        <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                            Interested Tenants
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Tenants who applied for any unit under your property.
                        </p>
                        {propertyDetails && (
                            <p className="mt-2 text-gray-700 font-medium">
                                {propertyDetails.property_name} — {propertyDetails.city},{" "}
                                {propertyDetails.province}
                            </p>
                        )}
                    </div>
                </div>

                {/* Subscription Info */}
                {subscription && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${
                            subscription.plan_name === "Premium Plan"
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-amber-50 border border-amber-200"
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center">
                            <div>
                                <p className="font-medium">
                                    {subscription.plan_name === "Premium Plan"
                                        ? "Premium Plan: Unlimited prospective tenants"
                                        : `${subscription.plan_name}: ${subscription.listingLimits.maxProspect} visible tenants`}
                                </p>
                                {hiddenTenants.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                        {hiddenTenants.length} tenant(s) hidden — upgrade to view
                                        all.
                                    </p>
                                )}
                            </div>
                            {hiddenTenants.length > 0 && (
                                <button
                                    onClick={handleUpgradeClick}
                                    className="mt-3 sm:mt-0 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                >
                                    Upgrade Plan
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Tenant Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between text-sm text-gray-600">
            <span>
              Showing {visibleTenants.length} of {tenants.length} total tenants
            </span>
                        <span className="text-blue-600 font-medium">
              Property-wide view
            </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">
                                    Profile
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">
                                    Unit Applied
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-center font-semibold text-gray-600">
                                    Action
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {visibleTenants.map((tenant) => (
                                <tr
                                    key={tenant.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <Image
                                            src={
                                                tenant?.profilePicture ||
                                                "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                            }
                                            alt="Profile"
                                            width={48}
                                            height={48}
                                            className="rounded-full h-10 w-10 border border-gray-200"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-800 font-medium">
                                        {tenant.firstName} {tenant.lastName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div>{tenant.email}</div>
                                        <div className="text-xs text-gray-500">
                                            {tenant.phoneNumber}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">
                                        {tenant.unit_name || "—"}
                                    </td>
                                    <td className="px-6 py-4">
                      <span
                          className={`px-3 py-1 text-xs rounded-full font-semibold ${
                              tenant.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : tenant.status === "disapproved"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {tenant.status}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleTenantClick(tenant)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition"
                                        >
                                            <AiOutlineEye /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {visibleTenants.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center py-6 text-gray-500 italic"
                                    >
                                        No tenants have applied for this property yet.
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
