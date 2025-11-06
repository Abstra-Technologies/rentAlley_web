// pages/landlord/properties/[property_id]/billing/non-submetered/review/[unit_id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ReviewBillingPage = () => {
    const { unit_id } = useParams() as { unit_id: string };
    const router = useRouter();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [savedBills, setSavedBills] = useState<any>({});
    const [extraExpenses, setExtraExpenses] = useState<
        {
            charge_id?: number;
            type: string;
            amount: number;
            category: string;
            fromDB?: boolean;
        }[]
    >([]);
    const [discounts, setDiscounts] = useState<
        {
            charge_id?: number;
            type: string;
            amount: number;
            category: string;
            fromDB?: boolean;
        }[]
    >([]);
    const [pdc, setPdc] = useState<any>(null);
    const [loadingPdc, setLoadingPdc] = useState(false);

    // Fetch billing data for the **unit**
    const { data: billingData, error, isLoading, mutate } = useSWR(
        unit_id ? `/api/billing/non_submetered/getByUnit?unit_id=${unit_id}` : null,
        fetcher
    );

    const bills = billingData?.bills || [];
    const currentBill = bills[currentIndex];

    // Parse amount safely
    const parseAmount = (v: any): number => {
        if (v === null || v === undefined) return 0;
        const n = Number(String(v).replace(/,/g, ""));
        return Number.isFinite(n) ? n : 0;
    };

    const peso = (n: number) =>
        n.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    // PDC Fetch (by billing → lease)
    async function fetchPDCData(billingId?: number, leaseId?: number) {
        try {
            setLoadingPdc(true);
            console.log("🔍 Fetching PDC data...", { billingId, leaseId });

            // Prefer by billing first, then lease
            let res;
            if (billingId) {
                console.log(`➡️ Fetching PDC by billing_id=${billingId}`);
                res = await axios.get(`/api/landlord/pdc/getByBilling?billing_id=${billingId}`);
            } else if (leaseId) {
                console.log(`➡️ Fetching PDC by lease_id=${leaseId}`);
                res = await axios.get(`/api/landlord/pdc/getByLease?lease_id=${leaseId}`);
            } else {
                console.warn("⚠️ fetchPDCData called without billingId or leaseId.");
                setPdc(null);
                return;
            }

            const data = res?.data;
            console.log("✅ Raw PDC API response:", data);

            // Expecting a single PDC or null.
            let _pdc = null;
            if (Array.isArray(data?.pdcs)) {
                // Pick pending first, then cleared, then fallback
                _pdc =
                    data.pdcs.find((x: any) => x.status === "pending") ||
                    data.pdcs.find((x: any) => x.status === "cleared") ||
                    data.pdcs[0] ||
                    null;
            } else {
                _pdc = data?.pdc ?? null;
            }

            console.log("🎯 Selected PDC:", _pdc);
            setPdc(_pdc);
        } catch (e: any) {
            console.error("❌ Error fetching PDC data:", e?.response?.data || e.message);
            // Silent fail—no PDC is fine
            setPdc(null);
        } finally {
            setLoadingPdc(false);
            console.log("⏹️ Finished fetching PDC data.");
        }
    }

    // Load PDC when current bill changes
    useEffect(() => {
        if (currentBill?.billing_id || currentBill?.agreement_id) {
            fetchPDCData(currentBill.billing_id, currentBill.agreement_id);
        } else {
            setPdc(null);
        }
    }, [currentIndex, billingData]);

    // Populate extra charges & discounts
    useEffect(() => {
        if (!currentBill) {
            setExtraExpenses([]);
            setDiscounts([]);
            return;
        }

        const savedBill = savedBills[currentBill.unit_id];
        if (savedBill) {
            setExtraExpenses(savedBill.additional_charges || []);
            setDiscounts(savedBill.discounts || []);
            return;
        }

        const fromDBExtras = Array.isArray(currentBill.additional_charges)
            ? currentBill.additional_charges.map((a: any) => ({
                charge_id: a.charge_id,
                type: a.charge_type || "",
                amount: parseAmount(a.amount),
                category: a.charge_category || "additional",
                fromDB: true,
            }))
            : [];

        const fromDBDiscounts = Array.isArray(currentBill.discounts)
            ? currentBill.discounts.map((d: any) => ({
                charge_id: d.charge_id,
                type: d.charge_type || "",
                amount: parseAmount(d.amount),
                category: d.charge_category || "discount",
                fromDB: true,
            }))
            : [];

        setExtraExpenses((prev) => {
            const localNew = prev?.filter((e) => !e.fromDB) || [];
            return [...fromDBExtras, ...localNew];
        });

        setDiscounts((prev) => {
            const localNew = prev?.filter((d) => !d.fromDB) || [];
            return [...fromDBDiscounts, ...localNew];
        });
    }, [currentIndex, savedBills, billingData]);

    // Handlers
    const handleAddExpense = () => {
        setExtraExpenses([
            ...extraExpenses,
            { type: "", amount: 0, category: "additional" },
        ]);
    };

    const handleExpenseChange = (
        index: number,
        field: "type" | "amount",
        value: string | number
    ) => {
        const updated = [...extraExpenses];
        updated[index] = {
            ...updated[index],
            [field]: field === "amount" ? Number(value) : value,
        };
        setExtraExpenses(updated);
    };

    const handleRemoveExpense = async (index: number, item: any) => {
        if (item.fromDB && item.charge_id) {
            try {
                await axios.delete("/api/billing/non_submetered/deleteCharge", {
                    data: { charge_id: item.charge_id },
                });
                Swal.fire("Deleted!", "Additional charge removed.", "success");
                await mutate();
            } catch (err: any) {
                const msg =
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Database error: Could not delete additional charge.";
                Swal.fire("Delete Failed", msg, "error");
                return;
            }
        }
        setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
    };

    const handleAddDiscount = () => {
        setDiscounts([...discounts, { type: "", amount: 0, category: "discount" }]);
    };

    const handleDiscountChange = (
        index: number,
        field: "type" | "amount",
        value: string | number
    ) => {
        const updated = [...discounts];
        updated[index] = {
            ...updated[index],
            [field]: field === "amount" ? Number(value) : value,
        };
        setDiscounts(updated);
    };

    const handleRemoveDiscount = async (index: number, item: any) => {
        if (item.fromDB && item.charge_id) {
            try {
                await axios.delete("/api/billing/non_submetered/deleteCharge", {
                    data: { charge_id: item.charge_id },
                });
                Swal.fire("Deleted!", "Discount removed.", "success");
                await mutate();
            } catch (err: any) {
                const msg =
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Database error: Could not delete discount.";
                Swal.fire("Delete Failed", msg, "error");
                return;
            }
        }
        setDiscounts(discounts.filter((_, i) => i !== index));
    };

    // Helper Functions
    // 🔹 Helper Functions
    const getAdvanceDeduction = (bill: any) =>
        bill.advance_payment_months > 0
            ? parseAmount(bill.advance_payment_amount) /
            Math.max(1, parseAmount(bill.advance_payment_months))
            : 0;

    const calculateSubtotal = (bill: any, extras: any[]) => {
        const base = parseAmount(bill.base_rent);
        const extrasTotal = extras.reduce((s, e) => s + parseAmount(e.amount), 0);
        const advance = getAdvanceDeduction(bill);
        return base + extrasTotal - advance;
    };

    const calculateDiscountTotal = (discounts: any[]) =>
        discounts.reduce((s, d) => s + parseAmount(d.amount), 0);

    /**
     * ✅ Calculates total payable considering cleared PDCs
     * @param bill - The billing record
     * @param extras - Additional charges
     * @param discounts - Discounts applied
     * @param pdc - The post-dated check record (optional)
     */
    const calculateTotal = (bill: any, extras: any[], discounts: any[], pdc?: any) => {
        const subtotal = calculateSubtotal(bill, extras);
        const discountTotal = calculateDiscountTotal(discounts);

        // ✅ Deduct rent only if PDC is cleared
        let pdcDeduction = 0;
        if (pdc && pdc.status === "cleared") {
            // Deduct only rent portion, not total
            pdcDeduction = parseAmount(bill.base_rent);
        }

        return subtotal - discountTotal - pdcDeduction;
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

            // ✅ New: Exclude rent if PDC is cleared
            const includeRent = !(pdc && pdc.status === "cleared");
            const baseRent = includeRent ? parseAmount(bill.base_rent) : 0;

            const total =
                baseRent + additionalExpenseTotal - advanceDeduction - discountTotal;

            await axios.post("/api/billing/non_submetered/saveBill", {
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

            Swal.fire("Saved!", "Billing saved successfully.", "success");
        } catch (err: any) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Database error: Failed to save billing data.";
            Swal.fire("Save Failed", msg, "error");
        }
    };

    const handleApproveBilling = async () => {
        try {
            await axios.post("/api/landlord/billing/approveNonSubmeteredBills", {
                unit_id,
            });
            Swal.fire(
                "Approved!",
                "Billing finalized and sent to tenant.",
                "success"
            );
            router.push(`/pages/landlord/properties/${currentBill.property_id}`);
        } catch (err: any) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Database error: Could not approve billing.";
            Swal.fire("Approval Failed", msg, "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading billing data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen text-red-600">
                Failed to load billing data. Please refresh or contact support.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4 text-sm sm:text-base"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
            </button>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-3xl mx-auto border border-gray-200">
                <div className="mb-6 text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                        {currentBill?.property_name || "Property"}
                    </h2>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                        Monthly Billing Review –{" "}
                        {currentBill?.billing_period
                            ? new Date(currentBill.billing_period).toLocaleDateString(
                                "en-US",
                                {
                                    month: "long",
                                    year: "numeric",
                                }
                            )
                            : ""}
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-600">
                        Review and confirm non-submetered billing for{" "}
                        <strong>{currentBill?.unit_name || "—"}</strong>.
                    </p>
                </div>

                {bills.length === 0 ? (
                    <p className="text-center text-gray-600">No billing data for this unit.</p>
                ) : (
                    <>
                        {/* Unit Info */}
                        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-lg font-semibold">
                                Unit: {currentBill.unit_name}
                            </p>
                            <p className="text-gray-700">
                                Tenant: {currentBill.tenant_name || "Vacant"}
                            </p>
                        </div>

                        {/* PDC Section */}
                        {loadingPdc ? (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                Loading PDC...
                            </div>
                        ) : pdc ? (
                            <div
                                className={`mb-6 p-4 rounded-lg border ${getPdcStatusColor(
                                    pdc.status
                                )}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getPdcStatusIcon(pdc.status)}
                                        <div>
                                            <p className="font-semibold">Post-Dated Check</p>
                                            <p className="text-sm">
                                                Check #{pdc.check_number} • ₱{peso(pdc.amount)} • Due:{" "}
                                                {formatDate(pdc.due_date)}
                                            </p>
                                            {pdc.status === "pending" && (
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Awaiting deposit
                                                </p>
                                            )}
                                            {pdc.status === "cleared" && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Cleared on {formatDate(pdc.cleared_at)}
                                                </p>
                                            )}
                                            {pdc.status === "bounced" && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    Bounced on {formatDate(pdc.bounced_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPdcBadgeColor(
                                            pdc.status
                                        )}`}
                                    >
                    {pdc.status.toUpperCase()}
                  </span>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                                <p className="font-medium text-yellow-800">No PDC attached</p>
                                <p className="text-yellow-700">
                                    Tenant has not submitted a post-dated check.
                                </p>
                            </div>
                        )}

                        {/* Charges */}
                        <div className="space-y-2 mb-4">
                            <p>
                                Base Rent: <strong>₱{peso(parseAmount(currentBill.base_rent))}</strong>
                            </p>

                            <p>
                                Late Fee per Day (reference only):{" "}
                                <strong>₱{peso(parseAmount(currentBill.late_penalty_amount))}</strong>
                            </p>
                        </div>

                        {currentBill.lease_additional_expenses?.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-sm mb-1">Lease Charges:</h4>
                                {currentBill.lease_additional_expenses.map((exp: any, i: number) => (
                                    <p key={i} className="text-sm">
                                        • {exp.type}: ₱{peso(exp.amount)} ({exp.frequency})
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Additional Charges */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-sm mb-2">Additional Charges</h4>
                            {extraExpenses.map((exp, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Type"
                                        value={exp.type}
                                        onChange={(e) =>
                                            handleExpenseChange(i, "type", e.target.value)
                                        }
                                        disabled={exp.fromDB}
                                        className={`flex-1 px-3 py-2 border rounded text-sm ${
                                            exp.fromDB ? "bg-gray-100" : ""
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={exp.amount}
                                        onChange={(e) =>
                                            handleExpenseChange(i, "amount", e.target.value)
                                        }
                                        disabled={exp.fromDB}
                                        className={`w-28 px-3 py-2 border rounded text-sm text-right ${
                                            exp.fromDB ? "bg-gray-100" : ""
                                        }`}
                                    />
                                    <button
                                        onClick={() => handleRemoveExpense(i, exp)}
                                        className="text-red-600 hover:text-red-800 text-xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddExpense}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                + Add Charge
                            </button>
                        </div>

                        {/* Discounts */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-sm mb-2">Discounts</h4>
                            {discounts.map((disc, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Type"
                                        value={disc.type}
                                        onChange={(e) =>
                                            handleDiscountChange(i, "type", e.target.value)
                                        }
                                        disabled={disc.fromDB}
                                        className={`flex-1 px-3 py-2 border rounded text-sm ${
                                            disc.fromDB ? "bg-gray-100" : ""
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={disc.amount}
                                        onChange={(e) =>
                                            handleDiscountChange(i, "amount", e.target.value)
                                        }
                                        disabled={disc.fromDB}
                                        className={`w-28 px-3 py-2 border rounded text-sm text-right ${
                                            disc.fromDB ? "bg-gray-100" : ""
                                        }`}
                                    />
                                    <button
                                        onClick={() => handleRemoveDiscount(i, disc)}
                                        className="text-red-600 hover:text-red-800 text-xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddDiscount}
                                className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                                + Add Discount
                            </button>
                        </div>

                        {/* Total Section */}
                        <div className="mt-6 border-t pt-4 text-right">
                            <p className="text-sm text-gray-600">
                                Subtotal: ₱{peso(calculateSubtotal(currentBill, extraExpenses))}
                            </p>

                            {calculateDiscountTotal(discounts) > 0 && (
                                <p className="text-sm text-green-600">
                                    Discounts: -₱{peso(calculateDiscountTotal(discounts))}
                                </p>
                            )}

                            {pdc && pdc.status === "cleared" && (
                                <p className="text-sm text-blue-600">
                                    Rent Covered by Cleared PDC: -₱{peso(parseAmount(currentBill.base_rent))}
                                </p>
                            )}

                            <p className="text-xl font-bold">
                                Total Due: ₱{peso(calculateTotal(currentBill, extraExpenses, discounts, pdc))}
                            </p>
                        </div>


                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleSaveBill(currentBill)}
                                className={`flex-1 py-2 rounded-lg font-semibold ${
                                    savedBills[currentBill.unit_id]?.saved
                                        ? "bg-green-600 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                {savedBills[currentBill.unit_id]?.saved ? "Saved" : "Save Bill"}
                            </button>

                            {bills.length > 1 && (
                                <div className="flex gap-2 flex-1">
                                    {currentIndex > 0 && (
                                        <button
                                            onClick={() => setCurrentIndex((prev) => prev - 1)}
                                            className="flex-1 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm"
                                        >
                                            ← Prev
                                        </button>
                                    )}
                                    {currentIndex < bills.length - 1 && (
                                        <button
                                            onClick={() => setCurrentIndex((prev) => prev + 1)}
                                            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm"
                                        >
                                            Next →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            Unit {currentIndex + 1} of {bills.length}
                        </p>

                        {/* Final Approve Button */}
                        {savedBills[currentBill.unit_id]?.saved && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={handleApproveBilling}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                                >
                                    Approve & Send to Tenant
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("en-PH") : "—";

const getPdcStatusIcon = (status: string) => {
    switch (status) {
        case "cleared":
            return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
        case "pending":
            return <ClockIcon className="h-6 w-6 text-orange-600" />;
        case "bounced":
        case "replaced":
            return <XCircleIcon className="h-6 w-6 text-red-600" />;
        default:
            return <ClockIcon className="h-6 w-6 text-gray-600" />;
    }
};

const getPdcStatusColor = (status: string) => {
    switch (status) {
        case "cleared":
            return "border-green-200 bg-green-50";
        case "pending":
            return "border-orange-200 bg-orange-50";
        case "bounced":
        case "replaced":
            return "border-red-200 bg-red-50";
        default:
            return "border-gray-200 bg-gray-50";
    }
};

const getPdcBadgeColor = (status: string) => {
    switch (status) {
        case "cleared":
            return "bg-green-100 text-green-800";
        case "pending":
            return "bg-orange-100 text-orange-800";
        case "bounced":
        case "replaced":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

export default ReviewBillingPage;