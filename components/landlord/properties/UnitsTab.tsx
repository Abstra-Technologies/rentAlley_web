"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import Fuse from "fuse.js";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
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

    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;

    const router = useRouter();
    const { fetchSession, user } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [billingMode, setBillingMode] = useState(false);
    const [unitBillingStatus, setUnitBillingStatus] = useState<Record<string, boolean>>({});
    const [propertyDetails, setPropertyDetails] = useState<any>(null);

    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkImportModal, setBulkImportModal] = useState(false);

    const { subscription, units, error, isLoading } = usePropertyData(property_id, landlord_id);

    const [searchQuery, setSearchQuery] = useState("");
    const [draggableUnits, setDraggableUnits] = useState<any[]>([]);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    useEffect(() => {
        if (units) setDraggableUnits(units);
    }, [units]);

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

        router.push(`/pages/landlord/properties/${property_id}/units/create?property_id=${id}`);
    };

    const handleDeleteUnit = async (unitId: number) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
        });
        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(`/api/unitListing/deleteUnit?id=${unitId}`);
            if (response.status === 200) {
                Swal.fire("Deleted!", "Unit has been deleted.", "success");
                mutate(`/api/propertyListing/property/${property_id}`);
            }
        } catch {
            Swal.fire("Error", "Failed to delete unit.", "error");
        }
    };

    /** SEARCH ENGINE */
    const fuse = useMemo(() => {
        return new Fuse(units || [], {
            keys: ["unit_name", "unit_style", "furnish", "amenities", "status"],
            threshold: 0.3,
        });
    }, [units]);

    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return draggableUnits;
        return fuse.search(searchQuery).map((r) => r.item);
    }, [searchQuery, fuse, draggableUnits]);

    const currentUnits = filteredUnits.slice(startIndex, startIndex + itemsPerPage);

    /** DRAG & DROP */
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = draggableUnits.findIndex((u) => u.unit_id === active.id);
        const newIndex = draggableUnits.findIndex((u) => u.unit_id === over.id);
        setDraggableUnits(arrayMove(draggableUnits, oldIndex, newIndex));
    };

    if (error) {
        return (
            <ErrorBoundary
                error="Failed to load units."
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-10 md:px-8 lg:px-10 xl:px-14">

                {/* HEADER */}
                <div className="mb-6 lg:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                <Home className="h-6 w-6 lg:h-5 lg:w-5 text-blue-600" />
                            </div>

                            <div>
                                <h1 className="text-2xl lg:text-xl font-bold text-gray-900">
                                    Unit Overview
                                </h1>
                                <p className="text-sm lg:text-xs text-gray-600 mt-1">
                                    Manage, search, and reorder all units
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div
                        className="
                            grid grid-cols-1 xs:grid-cols-2
                            sm:flex sm:justify-end
                            gap-2 sm:gap-3 mt-4
                        "
                    >
                        <button
                            onClick={handleAddUnitClick}
                            className="
                                flex items-center justify-center gap-2
                                px-5 py-2 text-sm
                                lg:px-3 lg:py-1.5 lg:text-xs lg:w-32
                                bg-gradient-to-r from-blue-600 to-emerald-600 text-white
                                rounded-lg shadow-md hover:opacity-90 transition
                            "
                        >
                            <Plus className="h-5 w-5 lg:h-4 lg:w-4" />
                            Add
                        </button>

                        <button
                            onClick={() => setBulkImportModal(true)}
                            className="
                                flex items-center justify-center gap-2
                                px-5 py-2 text-sm
                                lg:px-3 lg:py-1.5 lg:text-xs lg:w-32
                                bg-gradient-to-r from-indigo-600 to-blue-600 text-white
                                rounded-lg shadow-md hover:opacity-90 transition
                            "
                        >
                            <Sparkles className="h-5 w-5 lg:h-4 lg:w-4" />
                            Import
                        </button>

                        <button
                            onClick={() => {
                                if (!subscription || subscription?.is_active !== 1) {
                                    Swal.fire("Subscription Required", "Activate your subscription to use AI.", "info");
                                    return;
                                }
                                setIsAIGeneratorOpen(true);
                            }}
                            className="
                                flex items-center justify-center gap-2
                                px-5 py-2 text-sm
                                lg:px-3 lg:py-1.5 lg:text-xs lg:w-36
                                bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                                rounded-lg shadow-md hover:opacity-90 transition
                            "
                        >
                            <Sparkles className="h-5 w-5 lg:h-4 lg:w-4" />
                            Generate AI
                        </button>

                        <button
                            onClick={() => setInviteModalOpen(true)}
                            className="
                                flex items-center justify-center gap-2
                                px-5 py-2 text-sm
                                lg:px-3 lg:py-1.5 lg:text-xs lg:w-32
                                bg-gradient-to-r from-purple-600 to-pink-600 text-white
                                rounded-lg shadow-md hover:opacity-90 transition
                            "
                        >
                            <Sparkles className="h-5 w-5 lg:h-4 lg:w-4" />
                            Invite
                        </button>
                    </div>

                    {/* SEARCH BAR */}
                    <div className="mt-4 relative max-w-md">
                        <Search className="absolute left-3 top-3 lg:top-2.5 text-gray-400 h-5 w-5 lg:h-4 lg:w-4" />
                        <input
                            type="text"
                            placeholder="Search units..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="
                                w-full pl-10 pr-4 py-2 lg:py-1.5
                                text-sm lg:text-xs
                                border rounded-lg border-gray-300
                                focus:ring-2 focus:ring-emerald-500
                                transition
                            "
                        />
                    </div>
                </div>

                {/* UNIT LIST */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={currentUnits.map((u) => u.unit_id)} strategy={verticalListSortingStrategy}>
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
                                className="lg:text-xs lg:[&>*]:py-2 lg:[&>*]:px-3"
                            />
                        </SortableContext>
                    </DndContext>

                    {filteredUnits.length > itemsPerPage && (
                        <div className="flex justify-center p-4 lg:p-2 border-t">
                            <Pagination
                                count={Math.ceil(filteredUnits.length / itemsPerPage)}
                                page={page}
                                onChange={handlePageChange}
                                size="small"
                                color="primary"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {isAIGeneratorOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
                        <button
                            onClick={() => setIsAIGeneratorOpen(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                        >
                            ✕
                        </button>
                        <AIUnitGenerator propertyId={property_id} />
                    </div>
                </div>
            )}

            {inviteModalOpen && (
                <InviteTenantModal propertyId={property_id} onClose={() => setInviteModalOpen(false)} />
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
