"use client";

import Pagination from "@mui/material/Pagination";
import { Building2, Plus, Search } from "lucide-react";

import usePropertyListingPage from "@/hooks/landlord/usePropertyListingPage";
import PropertyCard from "@/components/landlord/properties/propertyCards";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

export default function PropertyListingPage() {
  const {
    // ================= DATA =================
    user,
    subscription,
    properties, // ✅ TOTAL properties (IMPORTANT)
    filteredProperties, // UI-only filtered list

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

  /* =========================
       SKELETON LOADING STATE
    ========================== */
  if (!user?.landlord_id || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title Skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-7 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
            </div>

            {/* Counter + Button Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse" />
            </div>
          </div>

          {/* Search Skeleton */}
          <div className="mt-4 max-w-2xl">
            <div className="h-11 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5 pb-24">
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row items-center gap-3 w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3"
              >
                {/* Image Skeleton */}
                <div className="w-full sm:w-28 h-24 bg-gray-200 rounded-md animate-pulse flex-shrink-0" />

                {/* Content Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
                  {/* Info Skeleton */}
                  <div className="flex-1 min-w-[180px] space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                  </div>

                  {/* Analytics Skeleton */}
                  <div className="flex flex-1 justify-evenly sm:justify-around gap-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                    </div>
                  </div>

                  {/* Actions Skeleton */}
                  <div className="flex gap-1.5">
                    <div className="h-7 w-16 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-7 w-16 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-7 w-16 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================
       SUBSCRIPTION LIMIT LOGIC
       ✅ FIXED (TOTAL COUNT ONLY)
    ========================== */
  const maxProperties = subscription?.limits?.maxProperties ?? null;
  const totalCount = properties.length;

  const isAddDisabled = maxProperties !== null && totalCount >= maxProperties;

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
                  {totalCount} / {maxProperties === null ? "∞" : maxProperties}
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

        {/* Pagination */}
        {filteredProperties.length > itemsPerPage && (
          <div className="mt-6 flex justify-center">
            <Pagination
              count={Math.ceil(filteredProperties.length / itemsPerPage)}
              page={page}
              onChange={(_, v) => setPage(v)}
              shape="rounded"
              size="large"
              sx={{
                "& .MuiPaginationItem-root": {
                  "&.Mui-selected": {
                    background: "linear-gradient(to right, #2563eb, #10b981)",
                    color: "white",
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
