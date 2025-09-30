
"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ReviewBillingPage = () => {
    const { property_id } = useParams();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [savedBills, setSavedBills] = useState<any>({});

    const { data: billingData, error, isLoading } = useSWR(
        property_id
            ? `/api/billing/non_submetered/getData?property_id=${property_id}`
            : null,
        fetcher
    );

    const handleSaveBill = async (bill: any) => {
        try {
            await axios.post("/api/landlord/billing/saveNonSubmeteredBill", {
                property_id,
                unit_id: bill.unit_id,
                total: bill.total,
            });

            setSavedBills((prev: any) => ({ ...prev, [bill.unit_id]: true }));

            Swal.fire("Saved!", "Billing for this unit has been saved.", "success");
        } catch (err) {
            console.error("Error saving bill:", err);
            Swal.fire("Error", "Failed to save billing", "error");
        }
    };

    const handleApproveBilling = async () => {
        try {
            await axios.post("/api/landlord/billing/approveNonSubmeteredBills", {
                property_id,
            });
            Swal.fire("Approved!", "All billings confirmed and sent to tenants.", "success");
            router.push(`/pages/landlord/property-listing/view-unit/${property_id}`);
        } catch (err) {
            console.error("Error approving billing:", err);
            Swal.fire("Error", "Failed to approve billing", "error");
        }
    };

    if (isLoading) {
        return (
            <LandlordLayout>
                <div className="p-6 text-center">Loading billing data...</div>
            </LandlordLayout>
        );
    }

    if (error) {
        return (
            <LandlordLayout>
                <div className="p-6 text-center text-red-500">
                    Failed to load billing data
                </div>
            </LandlordLayout>
        );
    }

    const bills = billingData?.bills || [];
    const currentBill = bills[currentIndex];

    return (
        <LandlordLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Back
                </button>

                <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-200">
                    <h1 className="text-2xl font-bold mb-6">Review Non-Submetered Billing</h1>

                    {bills.length === 0 ? (
                        <p className="text-gray-600 text-center">
                            No auto-generated billing available for this month.
                        </p>
                    ) : (
                        <>
                            {/* Current Unit Billing */}
                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <p className="text-lg font-semibold mb-2">
                                    Unit: {currentBill.unit_name}
                                </p>
                                <p className="text-gray-700 mb-1">
                                    Tenant: {currentBill.tenant_name || "Vacant"}
                                </p>
                                <p className="text-gray-700 mb-1">
                                    Base Rent: ₱{currentBill.base_rent?.toLocaleString()}
                                </p>
                                <p className="text-gray-700 mb-1">
                                    Additional Charges: ₱
                                    {currentBill.additional_charges?.toLocaleString() || "0"}
                                </p>
                                <p className="font-bold text-gray-900 mt-2">
                                    Total: ₱{(currentBill.total || 0).toLocaleString()}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                                <button
                                    onClick={() => handleSaveBill(currentBill)}
                                    className={`flex-1 py-2 px-4 rounded-lg shadow-md font-semibold ${
                                        savedBills[currentBill.unit_id]
                                            ? "bg-green-500 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {savedBills[currentBill.unit_id] ? "Saved" : "Save"}
                                </button>

                                {currentIndex < bills.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                                        className="flex-1 py-2 px-4 rounded-lg shadow-md bg-gray-600 hover:bg-gray-700 text-white"
                                    >
                                        Next Unit →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApproveBilling}
                                        className="flex-1 py-2 px-4 rounded-lg shadow-md bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        Finish & Approve All
                                    </button>
                                )}
                            </div>

                            {/* Progress Indicator */}
                            <p className="text-center text-sm text-gray-500 mt-4">
                                Reviewing {currentIndex + 1} of {bills.length} units
                            </p>
                        </>
                    )}
                </div>
            </div>
        </LandlordLayout>
    );
};

export default ReviewBillingPage;
