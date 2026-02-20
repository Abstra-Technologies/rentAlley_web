"use client";

import React from "react";
import {
    Home,
    Plus,
    Sparkles,
    Search,
    QrCode,
} from "lucide-react";
import { Pagination } from "@mui/material";
import Swal from "sweetalert2";

import useSubscription from "@/hooks/landlord/useSubscription";
import UnitLimitsCard from "@/components/landlord/subscriptions-limitations/UnitLimitsCard";
import useAuthStore from "@/zustand/authStore";

import UnitsTab from "@/components/landlord/properties/UnitsTab";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";

import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";
import axios from "axios";
import { mutate } from "swr";

export default function ViewPropertyDetailedPage() {
    const { user } = useAuthStore();
    const landlordId = user?.landlord_id;

    const {
        subscription,
        loadingSubscription,
    } = useSubscription(landlordId);

    const {
        property_id,
        error,
        isLoading,

        page,
        setPage,
        itemsPerPage,
        units,

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

    const currentUnitsCount = units.length;
    const maxUnits = subscription?.limits?.maxUnits ?? null;

    const reachedUnitLimit =
        maxUnits !== null && currentUnitsCount >= maxUnits;

    const unitActionsDisabled =
        loadingSubscription || !subscription || reachedUnitLimit;

    // 🆕 Generate QR Codes (FUNCTION)
    const handleGenerateQRCodes = async () => {
        if (!units.length) {
            Swal.fire(
                "No Units",
                "There are no units available to generate QR codes.",
                "info"
            );
            return;
        }

        try {
            Swal.fire({
                title: "Generating QR Codes",
                text: "Please wait while we prepare your QR codes…",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // 👉 Backend should return a PDF or ZIP
            const response = await axios.post(
                "/api/landlord/unit/qr-code/generate",
                { property_id },
                { responseType: "blob" }
            );

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `unit-qr-codes-${property_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            Swal.close();
            Swal.fire(
                "Done",
                "QR codes generated successfully.",
                "success"
            );
        } catch (err) {
            Swal.close();
            Swal.fire(
                "Error",
                "Failed to generate QR codes. Please try again.",
                "error"
            );
        }
    };

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
                        <div className="
  grid grid-cols-2 gap-2
  sm:flex sm:flex-wrap sm:gap-3
  lg:justify-end
">

                            {/* Add Unit */}
                            <button
                                onClick={handleAddUnitClick}
                                disabled={unitActionsDisabled}
                                className={`w-full
      px-3 py-2
      sm:px-4 sm:py-2
      lg:px-5 lg:py-2.5
      rounded-lg font-semibold text-sm
      flex items-center justify-center gap-2
      transition-all active:scale-95
      ${
                                    unitActionsDisabled
                                        ? "bg-gray-300 text-gray-600"
                                        : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-md"
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="truncate">Add Unit</span>
                            </button>

                            {/* Bulk Import */}
                            <button
                                onClick={() => setBulkImportModal(true)}
                                className="w-full
      px-3 py-2
      sm:px-4 sm:py-2
      lg:px-5 lg:py-2.5
      rounded-lg font-semibold text-sm
      bg-gradient-to-r from-indigo-600 to-blue-600 text-white
      hover:shadow-md active:scale-95
      flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="truncate">Bulk Import</span>
                            </button>

                            {/* Invite Tenant */}
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="w-full
      px-3 py-2
      sm:px-4 sm:py-2
      lg:px-5 lg:py-2.5
      rounded-lg font-semibold text-sm
      bg-gradient-to-r from-purple-600 to-pink-600 text-white
      hover:shadow-md active:scale-95
      flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="truncate">Invite Tenant</span>
                            </button>

                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search units"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <UnitsTab
                        units={currentUnits}
                        isLoading={isLoading}
                        propertyId={property_id}
                        handleEditUnit={handleEditUnit}
                        handleDeleteUnit={handleDeleteUnit}
                        handleAddUnitClick={handleAddUnitClick}
                        onPublishToggle={(unitId, publish) => {
                            mutate(
                                `/api/unitListing/getUnitListings?property_id=${property_id}`,
                                (prev: any[]) =>
                                    prev.map((u) =>
                                        u.unit_id === unitId ? { ...u, publish } : u
                                    ),
                                false
                            );
                        }}
                    />

                    {filteredUnits.length > itemsPerPage && (
                        <div className="flex justify-center p-4 border-t">
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
