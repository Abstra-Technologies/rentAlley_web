"use client";

import React from "react";
import { Home, Plus, Sparkles, Search } from "lucide-react";
import { Pagination } from "@mui/material";

import useSubscription from "@/hooks/landlord/useSubscription";
import UnitLimitsCard from "@/components/landlord/subscriptions-limitations/UnitLimitsCard";
import useAuthStore from "@/zustand/authStore";

import UnitsTab from "@/components/landlord/properties/UnitsTab";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";

import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";

export default function ViewPropertyDetailedPage() {

    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const {
        subscription,
        loadingSubscription,
        errorSubscription,
    } = useSubscription(landlordId);

    const {
        property_id,
        error,
        isLoading,

        page,
        setPage,
        itemsPerPage,

        searchQuery,
        setSearchQuery,
        filteredUnits,
        currentUnits,

        handleAddUnitClick,
        handleEditUnit,
        handleDeleteUnit,

        isAIGeneratorOpen,
        setIsAIGeneratorOpen,
        inviteModalOpen,
        setInviteModalOpen,
        bulkImportModal,
        setBulkImportModal,
    } = usePropertyUnitsPage();

    const currentUnitsCount = filteredUnits.length;
    const maxUnits = subscription?.listingLimits?.maxUnits ?? 0;

    const reachedUnitLimit =
        !!subscription && currentUnitsCount >= maxUnits;

    const unitActionsDisabled =
        loadingSubscription || !subscription || reachedUnitLimit;

    if (error) {
        return (
            <ErrorBoundary
                error="Failed to load units. Please try again later."
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="min-h-screen w-full max-w-none bg-gray-50 pb-24 md:pb-6 overflow-x-hidden">

            <div className="w-full px-4 md:px-6 pt-20 md:pt-6">

                {/* ================= HEADER ================= */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                <Home className="w-5 h-5 text-white" />
                            </div>

                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                    Unit Overview
                                </h1>
                                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                    Manage and search all units under this property
                                </p>
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-wrap gap-2">
                            {/* Add Unit */}
                            <button
                                onClick={handleAddUnitClick}
                                disabled={unitActionsDisabled}
                                className={`inline-flex items-center gap-2
    px-3 py-2 md:px-4 md:py-2.5
    rounded-md md:rounded-lg
    text-xs md:text-sm font-semibold
    transition shadow-sm
    ${
                                    unitActionsDisabled
                                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                                }
  `}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Unit</span>
                            </button>


                            {/* Bulk Import */}
                            <button
                                onClick={() => setBulkImportModal(true)}
                                className="inline-flex items-center gap-2
      px-3 py-2 md:px-4 md:py-2.5
      rounded-md md:rounded-lg
      text-xs md:text-sm font-semibold
      bg-gradient-to-r from-indigo-600 to-blue-600
      hover:from-indigo-700 hover:to-blue-700
      text-white shadow-sm transition"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">Bulk Import</span>
                            </button>

                            {/* Invite Tenant */}
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="inline-flex items-center gap-2
      px-3 py-2 md:px-4 md:py-2.5
      rounded-md md:rounded-lg
      text-xs md:text-sm font-semibold
      bg-gradient-to-r from-purple-600 to-pink-600
      hover:from-purple-700 hover:to-pink-700
      text-white shadow-sm transition"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">Invite Tenant</span>
                            </button>
                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search units (e.g. 501, studio, furnished)"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* ================= UNIT LIMITS ================= */}

                {!loadingSubscription && (
                    <div className="mb-4 max-w-xl">
                        <UnitLimitsCard
                            subscription={subscription}
                            currentUnitsCount={currentUnitsCount}
                        />
                    </div>
                )}

                {/* ================= UNITS LIST ================= */}
                <div className="bg-white w-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <UnitsTab
                        units={currentUnits}
                        isLoading={isLoading}
                        unitBillingStatus={{}}
                        billingMode={false}
                        propertyId={property_id}
                        propertyDetails={null}
                        handleEditUnit={handleEditUnit}
                        handleDeleteUnit={handleDeleteUnit}
                        handleAddUnitClick={handleAddUnitClick}
                    />

                    {filteredUnits.length > itemsPerPage && (
                        <div className="flex justify-center p-4 border-t border-gray-100">
                            <Pagination
                                count={Math.ceil(filteredUnits.length / itemsPerPage)}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODALS ================= */}
            {isAIGeneratorOpen && (
                <AIUnitGenerator
                    propertyId={property_id}
                    onClose={() => setIsAIGeneratorOpen(false)}
                />
            )}

            {inviteModalOpen && (
                <InviteTenantModal
                    propertyId={property_id}
                    onClose={() => setInviteModalOpen(false)}
                />
            )}

            {bulkImportModal && (
                <BulkImportUnitModal
                    isOpen={bulkImportModal}
                    onClose={() => setBulkImportModal(false)}
                    propertyId={property_id}
                />
            )}
        </div>
    );
}
