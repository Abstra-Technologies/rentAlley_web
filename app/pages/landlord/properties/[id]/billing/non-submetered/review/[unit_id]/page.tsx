// pages/landlord/properties/[property_id]/billing/non-submetered/review/[unit_id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  X,
  CreditCard,
  AlertCircle,
  Building2,
  User,
  Calendar,
} from "lucide-react";

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
  const {
    data: billingData,
    error,
    isLoading,
    mutate,
  } = useSWR(
    unit_id ? `/api/landlord/billing/non-submetered/getByUnitId?unit_id=${unit_id}` : null,
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

      // Prefer by billing first, then lease
      let res;
      if (billingId) {
        res = await axios.get(
          `/api/landlord/pdc/getByBilling?billing_id=${billingId}`
        );
      } else if (leaseId) {
        res = await axios.get(
          `/api/landlord/pdc/getByLease?lease_id=${leaseId}`
        );
      } else {
        console.warn("⚠️ fetchPDCData called without billingId or leaseId.");
        setPdc(null);
        return;
      }

      const data = res?.data;

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
      console.error(
        "❌ Error fetching PDC data:",
        e?.response?.data || e.message
      );
      // Silent fail—no PDC is fine
      setPdc(null);
    } finally {
      setLoadingPdc(false);
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
  const calculateTotal = (
    bill: any,
    extras: any[],
    discounts: any[],
    pdc?: any
  ) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">
            Failed to load billing data. Please refresh or contact support.
          </p>
        </div>
      </div>
    );
  }

    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            <div className="w-full px-4 md:px-6 pt-10">

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="bg-white border border-gray-300 rounded-xl shadow-sm max-w-4xl mx-auto">

                    {/* HEADER */}
                    <div className="px-6 py-5 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Billing Statement
                        </h1>
                    </div>

                    {/* BILLING META */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-4 bg-slate-50 border-b text-sm">
                        <div>
                            <p className="text-gray-500">Billing Period</p>
                            <p className="font-semibold text-gray-900">
                                {currentBill?.billing_period
                                    ? new Date(currentBill.billing_period).toLocaleDateString(
                                        "en-US",
                                        { month: "long", year: "numeric" }
                                    )
                                    : "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-500">Unit</p>
                            <p className="font-semibold text-gray-900 flex items-center gap-1">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                {currentBill.unit_name}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-500">Tenant</p>
                            <p className="font-semibold text-gray-900 flex items-center gap-1">
                                <User className="w-4 h-4 text-gray-400" />
                                {currentBill.tenant_name || "Vacant"}
                            </p>
                        </div>
                    </div>

                    {bills.length === 0 ? (
                        <div className="text-center py-16">
                            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No billing data for this unit.</p>
                        </div>
                    ) : (
                        <>
                            {/* PDC */}
                            <div className="px-6 py-4 border-b">
                                {loadingPdc ? (
                                    <div className="flex items-center gap-2 text-sm text-blue-700">
                                        <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full" />
                                        Loading PDC…
                                    </div>
                                ) : pdc ? (
                                    <div
                                        className={`p-4 rounded-lg border ${getPdcStatusColor(
                                            pdc.status
                                        )}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                {getPdcStatusIcon(pdc.status)}
                                                <div>
                                                    <p className="text-sm font-semibold">
                                                        Post-Dated Check
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Check #{pdc.check_number} • ₱{peso(pdc.amount)} • Due{" "}
                                                        {formatDate(pdc.due_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPdcBadgeColor(
                                                    pdc.status
                                                )}`}
                                            >
                      {pdc.status.toUpperCase()}
                    </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                                        <p className="font-medium text-amber-900">
                                            No PDC attached
                                        </p>
                                        <p className="text-amber-700 text-xs mt-1">
                                            Tenant has not submitted a post-dated check.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* CORE CHARGES */}
                            <div className="px-6 py-6 border-b">
                                <div className="flex justify-between text-sm mb-3">
                                    <span className="text-gray-600">Base Rent</span>
                                    <span className="font-semibold">
                  ₱{peso(parseAmount(currentBill.base_rent))}
                </span>
                                </div>

                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Late Fee per Day (reference)</span>
                                    <span>
                  ₱{peso(parseAmount(currentBill.late_penalty_amount))}
                </span>
                                </div>
                            </div>

                            {/* LEASE CHARGES */}
                            {currentBill.lease_additional_expenses?.length > 0 && (
                                <div className="px-6 py-4 border-b bg-slate-50">
                                    <h4 className="text-xs font-semibold text-gray-600 mb-2">
                                        Lease Charges
                                    </h4>
                                    {currentBill.lease_additional_expenses.map(
                                        (exp: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex justify-between text-sm text-gray-700"
                                            >
                                                <span>{exp.type}</span>
                                                <span>₱{peso(exp.amount)}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* ADDITIONAL CHARGES */}
                            <div className="px-6 py-6 border-b">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    Additional Charges
                                </h4>

                                {extraExpenses.map((exp, i) => (
                                    <div key={i} className="flex gap-2 mb-2 items-center">
                                        <input
                                            value={exp.type}
                                            onChange={(e) =>
                                                handleExpenseChange(i, "type", e.target.value)
                                            }
                                            disabled={exp.fromDB}
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={exp.amount}
                                            onChange={(e) =>
                                                handleExpenseChange(i, "amount", e.target.value)
                                            }
                                            disabled={exp.fromDB}
                                            className="w-28 border border-gray-300 rounded-md px-2 py-1 text-sm text-right"
                                        />
                                        <button
                                            onClick={() => handleRemoveExpense(i, exp)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddExpense}
                                    className="text-sm text-blue-600 hover:underline mt-2"
                                >
                                    + Add Charge
                                </button>
                            </div>

                            {/* DISCOUNTS */}
                            <div className="px-6 py-6 border-b bg-slate-50">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                    Discounts
                                </h4>

                                {discounts.map((disc, i) => (
                                    <div key={i} className="flex gap-2 mb-2 items-center">
                                        <input
                                            value={disc.type}
                                            onChange={(e) =>
                                                handleDiscountChange(i, "type", e.target.value)
                                            }
                                            disabled={disc.fromDB}
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={disc.amount}
                                            onChange={(e) =>
                                                handleDiscountChange(i, "amount", e.target.value)
                                            }
                                            disabled={disc.fromDB}
                                            className="w-28 border border-gray-300 rounded-md px-2 py-1 text-sm text-right"
                                        />
                                        <button
                                            onClick={() => handleRemoveDiscount(i, disc)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddDiscount}
                                    className="text-sm text-emerald-600 hover:underline mt-2"
                                >
                                    + Add Discount
                                </button>
                            </div>

                            {/* TOTAL SUMMARY */}
                            <div className="px-6 py-6 bg-slate-50">
                                <div className="max-w-sm ml-auto space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>
                    ₱{peso(calculateSubtotal(currentBill, extraExpenses))}
                  </span>
                                    </div>

                                    {calculateDiscountTotal(discounts) > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Discounts</span>
                                            <span>
                      -₱{peso(calculateDiscountTotal(discounts))}
                    </span>
                                        </div>
                                    )}

                                    {pdc?.status === "cleared" && (
                                        <div className="flex justify-between text-green-600">
                                            <span>PDC Deduction</span>
                                            <span>
                      -₱{peso(parseAmount(currentBill.base_rent))}
                    </span>
                                        </div>
                                    )}

                                    <div className="border-t pt-2 flex justify-between text-base font-bold">
                                        <span>Total Due</span>
                                        <span>
                    ₱
                                            {peso(
                                                calculateTotal(
                                                    currentBill,
                                                    extraExpenses,
                                                    discounts,
                                                    pdc
                                                )
                                            )}
                  </span>
                                    </div>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="border-t px-6 py-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleSaveBill(currentBill)}
                                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm ${
                                        savedBills[currentBill.unit_id]?.saved
                                            ? "bg-emerald-600 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {savedBills[currentBill.unit_id]?.saved
                                        ? "✓ Saved"
                                        : "Save Bill"}
                                </button>

                                {savedBills[currentBill.unit_id]?.saved && (
                                    <button
                                        onClick={handleApproveBilling}
                                        className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                        Approve & Send to Tenant
                                    </button>
                                )}
                            </div>

                            <p className="text-center text-xs text-gray-500 py-4">
                                Unit {currentIndex + 1} of {bills.length}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

};

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("en-PH") : "—";

const getPdcStatusIcon = (status: string) => {
  switch (status) {
    case "cleared":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "pending":
      return <Clock className="h-5 w-5 text-orange-600" />;
    case "bounced":
    case "replaced":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
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
      return "bg-green-100 text-green-800 border border-green-200";
    case "pending":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "bounced":
    case "replaced":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
};

export default ReviewBillingPage;
