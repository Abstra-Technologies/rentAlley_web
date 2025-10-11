"use client";
import React, { useEffect, useState } from "react";
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
    const [extraExpenses, setExtraExpenses] = useState<
        { type: string; amount: number }[]
    >([]);
    const [discounts, setDiscounts] = useState<{ type: string; amount: number }[]>([]);

    // Hook for fetching billing data
    const { data: billingData, error, isLoading, mutate } = useSWR(
        property_id ? `/api/billing/non_submetered/getData?property_id=${property_id}` : null,
        fetcher
    );


    // Populate extraExpenses and discounts when switching units
    useEffect(() => {
        const currentBill = billingData?.bills?.[currentIndex];
        if (!currentBill) {
            setExtraExpenses([]);
            setDiscounts([]);
            return;
        }

        // 🧩 If user has unsaved edits for this unit, restore them
        const savedBill = savedBills[currentBill.unit_id];
        if (savedBill) {
            setExtraExpenses(savedBill.additional_charges || []);
            setDiscounts(savedBill.discounts || []);
            return;
        }

        const fromDBExtras = Array.isArray(currentBill.additional_charges)
            ? currentBill.additional_charges.map((a: any) => ({
                charge_id: a.charge_id, // ✅ preserve id for deletion
                type: a.charge_type || "",
                amount: parseAmount(a.amount),
                category: a.charge_category || "additional",
                fromDB: true,
            }))
            : [];

        const fromDBDiscounts = Array.isArray(currentBill.discounts)
            ? currentBill.discounts.map((d: any) => ({
                charge_id: d.charge_id, // ✅ preserve id for deletion
                type: d.charge_type || "",
                amount: parseAmount(d.amount),
                category: d.charge_category || "discount",
                fromDB: true,
            }))
            : [];


        // 🧠 Merge DB + any unsaved local charges (in case user switched back)
        setExtraExpenses((prev) => {
            // keep any locally added non-DB charges that aren't duplicates
            const localNew = prev?.filter((e) => !e.fromDB) || [];
            return [...fromDBExtras, ...localNew];
        });

        setDiscounts((prev) => {
            const localNew = prev?.filter((d) => !d.fromDB) || [];
            return [...fromDBDiscounts, ...localNew];
        });
    }, [currentIndex, savedBills, billingData]);

    const parseAmount = (v: any): number => {
        if (v === null || v === undefined) return 0;
        const n = Number(String(v).replace(/,/g, ""));
        return Number.isFinite(n) ? n : 0;
    };
    const peso = (n: number) =>
        n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Handlers
    const handleAddExpense = () => {
        setExtraExpenses([...extraExpenses, { type: "", amount: 0 }]);
    };

    const handleExpenseChange = (index: number, field: string, value: string | number) => {
        const updated = [...extraExpenses];
        updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) : value };
        setExtraExpenses(updated);
    };

    const handleRemoveExpense = async (index: number, item: any) => {
        console.log("Deleting charge:", item); // 👈 check this in browser console

        if (item.fromDB && item.charge_id) {
            try {
                await axios.delete("/api/billing/non_submetered/deleteCharge", {
                    data: { charge_id: item.charge_id },
                });

                Swal.fire("Deleted!", "Charge has been removed from billing.", "success");

                // Refresh from DB
                await mutate();
            } catch (error) {
                console.error("Error deleting charge:", error);
                Swal.fire("Error", "Failed to delete charge from database.", "error");
                return;
            }
        }

        // Remove locally either way
        setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
    };

    const handleRemoveDiscount = async (index: number, item: any) => {
        try {
            if (item.fromDB && item.charge_id) {
                await axios.delete("/api/billing/non_submetered/deleteCharge", {
                    data: { charge_id: item.charge_id },
                });

                Swal.fire("Deleted!", "Discount has been removed from billing.", "success");

                // ✅ Refresh billing data after deletion
                await mutate();
            }

            setDiscounts(discounts.filter((_, i) => i !== index));
        } catch (error) {
            console.error("Error deleting discount:", error);
            Swal.fire("Error", "Failed to delete discount.", "error");
        }
    };


    const handleAddDiscount = () => {
        setDiscounts([...discounts, { type: "", amount: 0 }]);
    };

    const handleDiscountChange = (index: number, field: string, value: string | number) => {
        const updated = [...discounts];
        updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) : value };
        setDiscounts(updated);
    };


    const handleSaveBill = async (bill: any) => {
        try {
            const advanceDeduction =
                parseAmount(bill.advance_payment_months) > 0
                    ? parseAmount(bill.advance_payment_amount) /
                    Math.max(1, parseAmount(bill.advance_payment_months))
                    : 0;

            const additionalExpenseTotal = extraExpenses.reduce(
                (sum, e) => sum + parseAmount(e.amount),
                0
            );

            const discountTotal = discounts.reduce(
                (sum, d) => sum + parseAmount(d.amount),
                0
            );

            const total =
                parseAmount(bill.base_rent) +
                parseAmount(bill.late_penalty_amount) +
                additionalExpenseTotal -
                advanceDeduction -
                discountTotal;

            await axios.post("/api/billing/non_submetered/saveBill", {
                property_id,
                unit_id: bill.unit_id,
                agreement_id: bill.agreement_id,
                total,
                additional_charges: extraExpenses.map((e) => ({
                    category: "additional",
                    type: e.type,
                    amount: parseAmount(e.amount),
                })),
                discounts: discounts.map((d) => ({
                    category: "discount",
                    type: d.type,
                    amount: parseAmount(d.amount),
                })),
            });

            setSavedBills((prev: any) => ({
                ...prev,
                [bill.unit_id]: {
                    saved: true,
                    additional_charges: extraExpenses,
                    discounts,
                    total,
                },
            }));

            Swal.fire("Saved!", "Billing for this unit has been saved.", "success");
        } catch (err) {
            console.error("Error saving bill:", err);
            Swal.fire("Error", "Failed to save billing. Please check your input and try again.", "error");
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
            Swal.fire("Error", "Failed to approve billing. Please try again.", "error");
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
                    Failed to load billing data. Please try again.
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

                {/* Computations */}
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-200">
                    <div className="mb-6 text-center sm:text-left">
                        <h2 className="text-xl font-semibold text-gray-700">
                            {currentBill?.property_name || "Property"}
                        </h2>

                        <h1 className="text-3xl font-bold text-gray-900 mt-1">
                            Monthly Billing Review –{" "}
                            {currentBill?.billing_period
                                ? new Date(currentBill.billing_period).toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })
                                : ""}
                        </h1>

                        <p className="mt-2 text-gray-600 max-w-2xl">
                            Review and confirm the automatically generated monthly billing for your{" "}
                            <span className="font-medium text-blue-600">non-submetered property</span>. Verify base rent,
                            deductions, and additional charges before finalizing.
                        </p>
                    </div>

                    {bills.length === 0 ? (
                        <p className="text-gray-600 text-center">No auto-generated billing available for this month.</p>
                    ) : (
                        <>
                            {/* Current Unit Billing */}
                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <p className="text-lg font-semibold mb-2">Unit: {currentBill.unit_name}</p>
                                <p className="text-gray-700 mb-1">Tenant: {currentBill.tenant_name || "Vacant"}</p>

                                {/* Charges & Deductions (NO security deposit deduction) */}
                                <div className="mt-3 space-y-2">
                                    <p className="text-gray-700">
                                        Base Rent: ₱{peso(parseAmount(currentBill.base_rent))}
                                    </p>

                                    <p className="text-gray-700">
                                        Advance Payment Deduction: ₱
                                        {peso(
                                            currentBill.advance_payment_months > 0
                                                ? parseAmount(currentBill.advance_payment_amount) /
                                                Math.max(1, parseAmount(currentBill.advance_payment_months))
                                                : 0
                                        )}
                                    </p>

                                    {parseAmount(currentBill.advance_payment_months) > 0 && (
                                        <p className="text-xs text-gray-500 ml-2">
                                            Remaining Months: {parseAmount(currentBill.advance_payment_months)}
                                        </p>
                                    )}

                                    <p className="text-gray-700">
                                        Late Payment Charge per Day: ₱{peso(parseAmount(currentBill.late_penalty_amount))}
                                    </p>

                                    {currentBill.lease_additional_expenses?.length > 0 && (
                                        <div className="mt-2">
                                            <h4 className="text-sm font-semibold text-gray-700">Other Charges:</h4>
                                            {currentBill.lease_additional_expenses.map((exp: any, idx: number) => (
                                                <p key={idx} className="text-gray-700 text-sm ml-2">
                                                    • {exp.type}: ₱{peso(parseAmount(exp.amount))}{" "}
                                                    <span className="text-gray-500 text-xs">({exp.frequency})</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Charges */}
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Charges:</h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Add extra charges such as parking fees, association dues, maintenance, or penalties.
                                    These will be added to the tenant’s monthly bill.
                                </p>

                                {extraExpenses.length > 0 ? (
                                    extraExpenses.map((exp, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Type (e.g. Parking)"
                                                value={exp.type}
                                                onChange={(e) => handleExpenseChange(idx, "type", e.target.value)}
                                                disabled={exp.fromDB}
                                                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                                                    exp.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                                                }`}
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Amount"
                                                value={exp.amount}
                                                onChange={(e) => handleExpenseChange(idx, "amount", e.target.value)}
                                                disabled={exp.fromDB}
                                                className={`w-32 px-3 py-2 border rounded-lg text-sm text-right ${
                                                    exp.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                                                }`}
                                            />

                                            {/* 🗑️ Delete button for both new and DB-sourced */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExpense(idx, exp)}
                                                className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm italic mb-2">No additional charges set.</p>
                                )}

                                {/* ✅ Always keep Add button */}
                                <button
                                    type="button"
                                    onClick={handleAddExpense}
                                    className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-sm font-medium"
                                >
                                    + Add Expense
                                </button>
                            </div>

                            {/* Discounts */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Discounts:</h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Apply discounts such as promos, loyalty rewards, or landlord goodwill.
                                    These will reduce the tenant’s monthly bill.
                                </p>

                                {discounts.length > 0 ? (
                                    discounts.map((disc, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Type (e.g. Promo)"
                                                value={disc.type}
                                                onChange={(e) => handleDiscountChange(idx, "type", e.target.value)}
                                                disabled={disc.fromDB}
                                                className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                                                    disc.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                                                }`}
                                            />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Amount"
                                                value={disc.amount}
                                                onChange={(e) => handleDiscountChange(idx, "amount", e.target.value)}
                                                disabled={disc.fromDB}
                                                className={`w-32 px-3 py-2 border rounded-lg text-sm text-right ${
                                                    disc.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                                                }`}
                                            />

                                            {/* 🗑️ Delete button for all */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDiscount(idx, disc)}
                                                className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm italic mb-2">No discounts applied.</p>
                                )}

                                {/* ✅ Always keep Add button */}
                                <button
                                    type="button"
                                    onClick={handleAddDiscount}
                                    className="mt-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-700 text-sm font-medium"
                                >
                                    + Add Discount
                                </button>
                            </div>

                            {/* Computed Total */}
                            <div className="mt-6 border-t pt-4 text-right">
                                {(() => {
                                    const advanceDeduction =
                                        parseAmount(currentBill.advance_payment_months) > 0
                                            ? parseAmount(currentBill.advance_payment_amount) /
                                            Math.max(1, parseAmount(currentBill.advance_payment_months))
                                            : 0;

                                    const additionalExpenseTotal = extraExpenses.reduce(
                                        (sum, e) => sum + parseAmount(e.amount),
                                        0
                                    );

                                    const discountTotal = discounts.reduce(
                                        (sum, d) => sum + parseAmount(d.amount),
                                        0
                                    );

                                    // 🔄 live total (includes discounts)
                                    const total =
                                        parseAmount(currentBill.base_rent) +
                                        parseAmount(currentBill.late_penalty_amount) +
                                        additionalExpenseTotal -
                                        advanceDeduction -
                                        discountTotal;

                                    return (
                                        <>
                                            <p className="text-sm text-gray-600">
                                                Subtotal: ₱
                                                {peso(
                                                    parseAmount(currentBill.base_rent) +
                                                    parseAmount(currentBill.late_penalty_amount) +
                                                    additionalExpenseTotal -
                                                    advanceDeduction
                                                )}
                                            </p>
                                            {discountTotal > 0 && (
                                                <p className="text-sm text-green-600">
                                                    Discounts Applied: -₱{peso(discountTotal)}
                                                </p>
                                            )}
                                            <p className="text-xl font-bold text-gray-900">
                                                Total Due: ₱{peso(total)}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Action Buttons / Progress stay the same */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                                <button
                                    onClick={() => handleSaveBill(currentBill)}
                                    className={`flex-1 py-2 px-4 rounded-lg shadow-md font-semibold ${
                                        savedBills[currentBill.unit_id]?.saved
                                            ? "bg-green-500 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {savedBills[currentBill.unit_id]?.saved ? "Saved" : "Save"}
                                </button>

                                <div className="flex flex-1 gap-3">
                                    {currentIndex > 0 && (
                                        <button
                                            onClick={() => setCurrentIndex((prev) => prev - 1)}
                                            className="flex-1 py-2 px-4 rounded-lg shadow-md bg-gray-500 hover:bg-gray-600 text-white"
                                        >
                                            ← Previous Unit
                                        </button>
                                    )}

                                    {currentIndex < bills.length - 1 && (
                                        <button
                                            onClick={() => setCurrentIndex((prev) => prev + 1)}
                                            className="flex-1 py-2 px-4 rounded-lg shadow-md bg-gray-600 hover:bg-gray-700 text-white"
                                        >
                                            Next Unit →
                                        </button>
                                    )}
                                </div>
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