"use client";

/**
 * @page         ViewPropertyDetailedPage
 * @route        app/pages/landlord/properties/[id]/page.tsx
 * @desc         Displays the list of units in the property (simplified header: "Unit Overview").
 */

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
    HomeIcon,
    PlusCircleIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/zustand/authStore";
import UnitsTab from "@/components/landlord/properties/UnitsTab";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [billingData, setBillingData] = useState<any>(null);
    const [billingForm, setBillingForm] = useState({
        billingPeriod: "",
        electricityConsumption: "",
        electricityTotal: "",
        waterConsumption: "",
        waterTotal: "",
    });
    const [unitBillingStatus, setUnitBillingStatus] = useState<Record<string, boolean>>({});
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

    // fetch property, subscription, and units
    const { subscription, units, error, isLoading } = usePropertyData(
        property_id,
        landlord_id
    );

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    const handlePageChange = (event: any, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingForm({ ...billingForm, [name]: value });
    };

    const handleSaveOrUpdateBilling = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = "/api/landlord/billing/savePropertyUtilityBillingMonthly";
            await axios.post(url, { property_id, ...billingForm });
            Swal.fire("Success", "Billing saved successfully.", "success");
            setIsModalOpen(false);
        } catch {
            Swal.fire("Error", "Failed to save billing.", "error");
        }
    };

    useEffect(() => {
        const fetchUnitBillingStatus = async () => {
            if (!units || units.length === 0) return;
            const statusMap: Record<string, boolean> = {};
            await Promise.all(
                units.map(async (unit: any) => {
                    try {
                        const response = await axios.get(
                            `/api/landlord/billing/getUnitDetails/billingStatus?unit_id=${unit.unit_id}`
                        );
                        statusMap[unit.unit_id] = response.data?.hasBillForThisMonth || false;
                    } catch (error) {
                        console.error(`Error fetching billing status for unit ${unit.unit_id}`, error);
                    }
                })
            );
            setUnitBillingStatus(statusMap);
        };
        fetchUnitBillingStatus();
    }, [units]);

    const handleEditUnit = (unitId: number) => {
        router.push(`/pages/landlord/property-listing/view-unit/${property_id}/edit-unit/${unitId}`);
    };

    const handleAddUnitClick = () => {
        if (!subscription) {
            Swal.fire("Subscription Required", "Please subscribe to add a unit.", "warning");
            return;
        }
        if (units.length >= subscription.listingLimits.maxUnits) {
            Swal.fire(
                "Unit Limit Reached",
                `You have reached your plan limit (${subscription.listingLimits.maxUnits}).`,
                "error"
            );
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
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });
        if (!result.isConfirmed) return;

        try {
            const response = await axios.delete(`/api/unitListing/deleteUnit?id=${unitId}`);
            if (response.status === 200) {
                Swal.fire("Deleted!", "Unit has been deleted.", "success");
                mutate(`/api/propertyListing/property/${property_id}`);
            }
        } catch {
            Swal.fire("Error", "Failed to delete the unit.", "error");
        }
    };

    const currentUnits = units?.slice(startIndex, startIndex + itemsPerPage) || [];

    if (error) {
        return (
            <ErrorBoundary
                error="Failed to load units. Please try again later."
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
            {/* ===== Simplified Header ===== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                {/* Left — Icon + Title */}
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm flex-shrink-0">
                        <HomeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 leading-snug">
                            Unit Overview
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
                            Manage and review all units under this property.
                            View occupancy status, update unit details, handle billing modes,
                            and monitor tenant applications or leads efficiently.
                        </p>
                    </div>
                </div>

                {/* Right — Action Buttons */}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                    <button
                        onClick={handleAddUnitClick}
                        className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5
    bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-base sm:text-sm font-semibold
    rounded-xl shadow-md hover:from-blue-700 hover:to-emerald-700 active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    transition-all w-full sm:w-auto"
                    >
                        <PlusCircleIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                        Add Unit
                    </button>

                    <button
                        onClick={() => {
                            if (!subscription || subscription?.is_active !== 1) {
                                Swal.fire(
                                    "Subscription Required",
                                    "Activate your subscription to use AI unit generation.",
                                    "info"
                                );
                                return;
                            }
                            setIsAIGeneratorOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5
    bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-base sm:text-sm font-semibold
    rounded-xl shadow-md hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
    transition-all w-full sm:w-auto"
                    >
                        <span className="text-lg sm:text-base">🤖</span>
                        Generate with AI
                    </button>
                </div>
            </div>

            {/* ===== Units List ===== */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-3 sm:p-5 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-emerald-50 min-h-[50vh] flex flex-col">
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
                </div>

                {units && units.length > itemsPerPage && (
                    <div className="flex justify-center p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10 backdrop-blur-sm">
                        <Pagination
                            count={Math.ceil(units.length / itemsPerPage)}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                            size="large"
                        />
                    </div>
                )}
            </div>

            {/* Property Utility Rate Modal */}
            <PropertyRatesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                billingData={billingData}
                billingForm={billingForm}
                propertyDetails={propertyDetails}
                hasBillingForMonth={false}
                handleInputChange={handleInputChange}
                handleSaveOrUpdateBilling={handleSaveOrUpdateBilling}
            />

            {/* AI Generator Modal */}
            {isAIGeneratorOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-3 p-6 relative border border-gray-200">
                        <button
                            onClick={() => setIsAIGeneratorOpen(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                        >
                            ✖
                        </button>
                        <AIUnitGenerator propertyId={property_id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewPropertyDetailedPage;
