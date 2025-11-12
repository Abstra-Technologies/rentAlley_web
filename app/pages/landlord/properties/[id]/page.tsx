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

    const { subscription, units, error, isLoading } = usePropertyData(property_id, landlord_id);

    // ✅ Search state
    const [searchQuery, setSearchQuery] = useState("");
    // ✅ Draggable units state
    const [draggableUnits, setDraggableUnits] = useState<any[]>([]);

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    useEffect(() => {
        if (units) setDraggableUnits(units);
    }, [units]);

    const handlePageChange = (event: any, value: number) => {
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
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        });
        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(`/api/unitListing/deleteUnit?id=${unitId}`);
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

    // ✅ Fuse.js setup
    const fuse = useMemo(() => {
        return new Fuse(units || [], {
            keys: ["unit_name", "unit_style", "furnish", "amenities", "status"],
            threshold: 0.3,
        });
    }, [units]);

    // ✅ Filter units
    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return draggableUnits || [];
        return fuse.search(searchQuery).map((result) => result.item);
    }, [searchQuery, fuse, draggableUnits]);

    // ✅ Pagination
    const currentUnits = filteredUnits?.slice(startIndex, startIndex + itemsPerPage) || [];

    // ✅ DnD sensors
    const sensors = useSensors(useSensor(PointerSensor));

    // ✅ DnD Handler
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = draggableUnits.findIndex((u) => u.unit_id === active.id);
        const newIndex = draggableUnits.findIndex((u) => u.unit_id === over.id);

        const reordered = arrayMove(draggableUnits, oldIndex, newIndex);
        setDraggableUnits(reordered);

        // Optionally persist to backend
        // axios.post('/api/unitListing/updateOrder', { property_id, newOrder: reordered.map(u => u.unit_id) });
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
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Home className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Unit Overview</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage, search, and reorder all units under this property
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={handleAddUnitClick}
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-emerald-700 transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Add Unit</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (!subscription || subscription?.is_active !== 1) {
                                        Swal.fire({
                                            title: "Subscription Required",
                                            text: "Activate your subscription to use AI unit generation.",
                                            icon: "info",
                                            confirmButtonColor: "#3b82f6",
                                        });
                                        return;
                                    }
                                    setIsAIGeneratorOpen(true);
                                }}
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all"
                            >
                                <Sparkles className="h-5 w-5" />
                                <span>Generate with AI</span>
                            </button>
                        </div>
                    </div>

                    {/* ✅ Search Bar */}
                    <div className="mt-4 relative max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search units (e.g. 501, studio, furnished, aircon)"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                        />
                    </div>
                </div>

                {/* ✅ Draggable Units List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={currentUnits.map((unit) => unit.unit_id)}
                            strategy={verticalListSortingStrategy}
                        >
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
                        </SortableContext>
                    </DndContext>

                    {filteredUnits && filteredUnits.length > itemsPerPage && (
                        <div className="flex justify-center p-4 bg-white border-t border-gray-200">
                            <Pagination
                                count={Math.ceil(filteredUnits.length / itemsPerPage)}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                                size="large"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Generator Modal */}
            {isAIGeneratorOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative border border-gray-200">
                        <button
                            onClick={() => setIsAIGeneratorOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                        <AIUnitGenerator propertyId={property_id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewPropertyDetailedPage;
