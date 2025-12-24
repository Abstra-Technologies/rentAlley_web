"use client";

import Pagination from "@mui/material/Pagination";
import { Building2, Plus, Search } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import usePropertyListingPage from "@/hooks/landlord/usePropertyListingPage";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

export default function PropertyListingPage() {
    const router = useRouter();

    const {
        user,
        subscription,
        properties,
        filteredProperties,
        page,
        setPage,
        searchQuery,
        setSearchQuery,
        loading,
        error,
        handleView,
        handleDelete,
        handleAddProperty,
        itemsPerPage,

        // flags from hook
        hasReachedLimit,
        isAddDisabled,
    } = usePropertyListingPage();

    /* =========================
       ERROR
    ========================== */
    if (error) {
        return (
            <ErrorBoundary
                error={error.message || "Failed to load properties."}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!user?.landlord_id || loading) {
        return <div className="min-h-screen bg-gray-50" />;
    }

    /* =========================
       UI STATES (INDEPENDENT)
    ========================== */
    const isNotSubscribed = !subscription;

    // 🔥 VERIFICATION IS ITS OWN AXIS
    // UI communicates requirement, hook enforces truth
    const isNotVerified = true;

    const maxProperties =
        subscription?.limits?.maxProperties ??
        subscription?.listingLimits?.maxProperties ??
        null;

    const totalCount = properties.length;

    /* =========================
       PAGINATION
    ========================== */
    const startIndex = (page - 1) * itemsPerPage;
    const currentPageItems = filteredProperties.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ================= HEADER ================= */}
            <div className="bg-white border-b border-gray-200 pt-20 pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Property Listings
                            </h1>
                            <p className="text-gray-600 text-sm">
                                Manage your properties and attract tenants
                            </p>
                        </div>
                    </div>

                    {/* Counter + CTA */}
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
              <span className="text-sm font-bold text-gray-900">
                {totalCount} /{" "}
                  {subscription
                      ? maxProperties === null
                          ? "∞"
                          : maxProperties
                      : "—"}
              </span>
                        </div>

                        <button
                            aria-disabled={isAddDisabled}
                            onClick={() => {
                                if (isNotSubscribed) {
                                    return Swal.fire({
                                        title: "Subscription required",
                                        text:
                                            "You need an active subscription to add properties.",
                                        icon: "info",
                                        confirmButtonText: "View plans",
                                    }).then((r) => {
                                        if (r.isConfirmed) {
                                            router.push(
                                                "/pages/landlord/subsciption_plan/pricing"
                                            );
                                        }
                                    });
                                }

                                if (hasReachedLimit) {
                                    return Swal.fire({
                                        title: "Property limit reached",
                                        text:
                                            "Upgrade your plan to add more properties.",
                                        icon: "error",
                                        confirmButtonText: "Upgrade plan",
                                    }).then((r) => {
                                        if (r.isConfirmed) {
                                            router.push(
                                                "/pages/landlord/subsciption_plan/pricing"
                                            );
                                        }
                                    });
                                }

                                // 🔥 VERIFICATION CHECK (SEPARATE)
                                if (isNotVerified) {
                                    return Swal.fire({
                                        title: "Verification required",
                                        text:
                                            "Your landlord account must be verified before adding properties.",
                                        icon: "warning",
                                        confirmButtonText: "Verify now",
                                    }).then((r) => {
                                        if (r.isConfirmed) {
                                            router.push("/pages/landlord/verification");
                                        }
                                    });
                                }

                                handleAddProperty();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                ${
                                isAddDisabled
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700"
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            Add Property
                        </button>
                    </div>
                </div>

                {/* ================= WARNINGS (INDEPENDENT & COEXISTING) ================= */}
                <div className="mt-3 space-y-2">
                    {isNotSubscribed && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <span className="font-semibold">⚠</span>
                            <span className="flex-1">
                An active subscription is required to add properties.
              </span>
                            <button
                                onClick={() =>
                                    router.push(
                                        "/pages/landlord/subsciption_plan/pricing"
                                    )
                                }
                                className="text-amber-900 font-semibold underline hover:text-amber-700"
                            >
                                Subscribe now
                            </button>
                        </div>
                    )}

                    {isNotVerified && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <span className="font-semibold">⚠</span>
                            <span className="flex-1">
                Your landlord account must be verified to list properties.
              </span>
                            <button
                                onClick={() =>
                                    router.push("/pages/landlord/verification")
                                }
                                className="text-amber-900 font-semibold underline hover:text-amber-700"
                            >
                                Verify now
                            </button>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="mt-4 max-w-2xl relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search properties by name, address, or ID..."
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg
                       focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* ================= CONTENT ================= */}
            <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5 pb-24">
                {currentPageItems.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {currentPageItems.map((property: any, idx: number) => (
                            <PropertyCard
                                key={property.property_id}
                                property={property}
                                index={startIndex + idx}
                                subscription={subscription}
                                handleView={handleView}
                                handleDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                            No properties found
                        </h3>
                        <p className="text-sm text-gray-600">
                            {searchQuery
                                ? "Try adjusting your search or add a new property."
                                : "Start by adding your first property to get started."}
                        </p>
                    </div>
                )}

                {filteredProperties.length > itemsPerPage && (
                    <div className="mt-6 flex justify-center">
                        <Pagination
                            count={Math.ceil(filteredProperties.length / itemsPerPage)}
                            page={page}
                            onChange={(_, v) => setPage(v)}
                            shape="rounded"
                            size="large"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
