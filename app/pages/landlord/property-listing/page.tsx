"use client";

import Pagination from "@mui/material/Pagination";
import { Building2, Plus, Search } from "lucide-react";

import usePropertyListingPage from "@/hooks/landlord/usePropertyListingPage";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

export default function PropertyListingPage() {
    const {
        // ================= DATA =================
        user,
        subscription,
        properties,            // ✅ TOTAL properties (IMPORTANT)
        filteredProperties,    // UI-only filtered list

        // ================= UI STATE =================
        page,
        setPage,
        searchQuery,
        setSearchQuery,

        // ================= FLAGS =================
        loading,
        error,

        // ================= HANDLERS =================
        handleView,
        handleDelete,
        handleAddProperty,

        // ================= PAGINATION =================
        itemsPerPage,
    } = usePropertyListingPage();

    /* =========================
       ERROR / LOADING
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
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
                <LoadingScreen message="Fetching your properties..." />
            </div>
        );
    }

    /* =========================
       SUBSCRIPTION LIMIT LOGIC
       ✅ FIXED (TOTAL COUNT ONLY)
    ========================== */
    const maxProperties = subscription?.limits?.maxProperties ?? null;
    const totalCount = properties.length;

    const isAddDisabled =
        maxProperties !== null && totalCount >= maxProperties;

    /* =========================
       PAGINATION (UI ONLY)
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

                    {/* Subscription Counter + CTA */}
                    {subscription && (
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2">
                                <span className="text-sm font-bold text-gray-900">
                                    {totalCount} /{" "}
                                    {maxProperties === null ? "∞" : maxProperties}
                                </span>
                            </div>

                            <button
                                onClick={handleAddProperty}
                                disabled={isAddDisabled}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                    isAddDisabled
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700"
                                }`}
                            >
                                <Plus className="w-5 h-5" />
                                Add Property
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
                            setPage(1); // ✅ reset pagination on search
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
                    <div className="bg-white border rounded-lg p-8 text-center">
                        <h3 className="font-bold text-gray-900">
                            No properties found
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Try adjusting your search or add a new property.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {filteredProperties.length > itemsPerPage && (
                    <div className="mt-6 flex justify-center">
                        <Pagination
                            count={Math.ceil(
                                filteredProperties.length / itemsPerPage
                            )}
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
