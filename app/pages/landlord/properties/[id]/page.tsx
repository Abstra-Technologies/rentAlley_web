"use client";

import React from "react";
import { Home, Plus, Sparkles, Search } from "lucide-react";
import { Pagination } from "@mui/material";

import UnitsTab from "@/components/landlord/properties/UnitsTab";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";

import { usePropertyUnitsPage } from "@/hooks/landlord/usePropertyUnitsPage";

const ViewPropertyDetailedPage = () => {
    const {
        property_id,
        subscription,
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

    if (error) {
        return (
            <ErrorBoundary
                error="Failed to load units. Please try again later."
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:px-8 lg:px-12 xl:px-16">
                {/* HEADER */}
                <div className="mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                            <Home className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Unit Overview
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Manage and search all units under this property
                            </p>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button
                            onClick={handleAddUnitClick}
                            className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-semibold shadow-md"
                        >
                            <Plus className="inline h-4 w-4 mr-1" />
                            Add Unit
                        </button>

                        <button
                            onClick={() => setBulkImportModal(true)}
                            className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold shadow-md"
                        >
                            <Sparkles className="inline h-4 w-4 mr-1" />
                            Bulk Import
                        </button>

                        <button
                            onClick={() => setInviteModalOpen(true)}
                            className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-md"
                        >
                            <Sparkles className="inline h-4 w-4 mr-1" />
                            Invite Tenant
                        </button>
                    </div>

                    {/* SEARCH */}
                    <div className="mt-4 relative max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search units (e.g. 501, studio, furnished)"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* UNIT LIST */}
                <div className="bg-white rounded-lg shadow-sm border">
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
                        <div className="flex justify-center p-4 border-t">
                            <Pagination
                                count={Math.ceil(
                                    filteredUnits.length / itemsPerPage
                                )}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
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
};

export default ViewPropertyDetailedPage;
