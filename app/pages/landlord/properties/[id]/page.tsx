"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import { Home, Plus, Sparkles, Search } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import UnitsTab from "@/components/landlord/properties/UnitsTab";
import { Pagination } from "@mui/material";
import { usePropertyData } from "@/hooks/usePropertyData";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import AIUnitGenerator from "@/components/landlord/ai/AIUnitGenerator";
import InviteTenantModal from "@/components/landlord/properties/InviteTenantModalPerProperty";
import BulkImportUnitModal from "@/components/landlord/properties/BulkImportUnitModal";

const ViewPropertyDetailedPage = () => {
    const { id } = useParams();
    const property_id = id as string;

    const router = useRouter();
    const { fetchSession, user } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;

    const [billingMode, setBillingMode] = useState(false);
    const [unitBillingStatus, setUnitBillingStatus] = useState<Record<string, boolean>>({});
    const [propertyDetails, setPropertyDetails] = useState<any>(null);

    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkImportModal, setBulkImportModal] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const { subscription, units = [], error, isLoading } =
        usePropertyData(property_id, landlord_id);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    const handlePageChange = (_: any, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEditUnit = (unitId: number) => {
        router.push(`/pages/landlord/properties/${property_id}/units/edit/${unitId}`);
    };

    const handleAddUnitClick = () => {
        if (!subscription) {
            Swal.fire({
                title: "Subscription Required",
                text: "Please subscribe to add a unit.",
                icon: "warning",
                confirmButtonColor: "#3b82f6",
            });
            return;
        }

        if (units.length >= subscription.listingLimits.maxUnits) {
            Swal.fire({
                title: "Unit Limit Reached",
                text: `You have reached your plan limit (${subscription.listingLimits.maxUnits}).`,
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        router.push(
            `/pages/landlord/properties/${property_id}/units/create?property_id=${id}`
        );
    };

    const handleDeleteUnit = async (unitId: number) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        });

        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(
                `/api/unitListing/deleteUnit?id=${unitId}`
            );

            if (response.status === 200) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Unit has been deleted.",
                    icon: "success",
                    confirmButtonColor: "#10b981",
                });
                mutate(`/api/propertyListing/property/${property_id}`);
            }
        } catch {
            Swal.fire({
                title: "Error",
                text: "Failed to delete the unit.",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    /* --------------------------------------------------
     * SIMPLE SEARCH (NO FUSE)
     * -------------------------------------------------- */
    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;

        const query = searchQuery.toLowerCase();

        return units.filter((unit: any) =>
            [
                unit.unit_name,
                unit.unit_style,
                unit.furnish,
                unit.amenities,
                unit.status,
            ]
                .filter(Boolean)
                .some((field) =>
                    String(field).toLowerCase().includes(query)
                )
        );
    }, [searchQuery, units]);

    const currentUnits =
        filteredUnits.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
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
                        unitBillingStatus={unitBillingStatus}
                        billingMode={billingMode}
                        propertyId={property_id}
                        propertyDetails={propertyDetails}
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
                                onChange={handlePageChange}
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
