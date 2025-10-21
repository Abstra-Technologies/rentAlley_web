"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency, toNumber } from "@/utils/formatter/formatters";
import useAuthStore from "../../../zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";

export default function TenantBilling({ agreement_id, user_id }) {
  const [billingData, setBillingData] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { user, admin, fetchSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user_id) return;

    const fetchBillingData = async () => {
      try {
        const res = await axios.get(`/api/tenant/billing/viewCurrentBilling`, {
          params: { agreement_id, user_id },
        });

        console.log("📦 Full Billing Response:", res.data);

        // ✅ Extract post-dated checks
        const pdcChecks = res.data.postDatedChecks || [];

        // ✅ Build normalized billing array
        const billings = res.data.billing
            ? [
              {
                ...res.data.billing,
                billingAdditionalCharges:
                    res.data.billingAdditionalCharges || [],
                leaseAdditionalExpenses: res.data.leaseAdditionalExpenses || [],
                breakdown: res.data.breakdown || {},
                propertyBillingTypes: res.data.propertyBillingTypes || {},
                propertyConfig: res.data.propertyConfig || {},
                postDatedChecks: pdcChecks, // ✅ added for PDC display
              },
            ]
            : [];

        // ✅ Correct logging reference
        if (billings.length > 0) {
          console.log("🏠 Billing Property Config:", billings[0].propertyConfig);
        }

        // ✅ Flatten meter readings
        const rawMeterReadings = res.data.meterReadings || {};
        const flatReadings = [
          ...(rawMeterReadings.water || []),
          ...(rawMeterReadings.electricity || []),
        ];

        setBillingData(billings);
        setMeterReadings(flatReadings);
      } catch (err) {
        console.error("❌ Billing fetch error:", err);
        setError("Failed to fetch billing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [agreement_id, user_id]);

  const computeLateFeeAndDays = (bill) => {
    const config = bill.propertyConfig;
    if (!config || bill.status === "paid") return { lateFee: 0, daysLate: 0 };

    const billingDueDay = Number(config.billingDueDay || 1);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Construct due date from property configuration
    const dueDate = new Date(currentYear, currentMonth, billingDueDay);

    const diffDays = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If within grace period → no penalty
    if (diffDays <= Number(config.gracePeriodDays || 0))
      return { lateFee: 0, daysLate: 0 };

    const daysLate = diffDays - Number(config.gracePeriodDays || 0);
    let lateFee = 0;

    if (config.lateFeeType === "percentage") {
      lateFee =
          (Number(bill.breakdown?.base_rent || 0) *
              Number(config.lateFeeAmount || 0)) /
          100;
    } else {
      lateFee =
          Number(config.lateFeeAmount || 0) * Math.max(daysLate, 1);
    }

    return { lateFee, daysLate };
  };

  const handleMayaPayment = async (amount, billing_id) => {
    const result = await Swal.fire({
      title: "Billing Payment via Maya",
      text: `Are you sure you want to pay your current billing through Maya?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay with Maya",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setLoadingPayment(true);
      try {
        const res = await axios.post("/api/tenant/billing/payment", {
          amount,
          billing_id,
          tenant_id: user?.tenant_id,
          payment_method_id: 7,
          redirectUrl: {
            success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
            failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
            cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billCancelled`,
          },
        });

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        }
      } catch (error) {
        console.error("Payment error:", error);
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Failed to process payment. Please try again.",
        });
      } finally {
        setLoadingPayment(false);
      }
    }
  };

  const handlePaymentOptions = (billing_id, amount) => {
    if (!agreement_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not find your agreement details. Please try again later.",
      });
      return;
    }

    router.push(
        `/pages/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${amount}&billingId=${billing_id}`
    );
  };

  if (loading)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
          <LoadingScreen message="Fetching your billing data, please wait..." />
        </div>
    );

  if (error) {
    return (
        <ErrorBoundary
            error={
                error.message ||
                "Failed to load data. Please check your internet connection or try again."
            }
            onRetry={() => window.location.reload()}
        />
    );
  }
  if (!Array.isArray(billingData) || billingData.length === 0) {
    return (
        <div className="text-gray-500 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          No billing records found.
        </div>
    );
  }

  return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Your Current Billing
          </h1>
          <span className="hidden sm:inline-flex items-center px-3 py-1 mt-2 sm:mt-0 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {billingData.length} {billingData.length === 1 ? "bill" : "bills"}
        </span>
        </div>

        <div className="space-y-6">
          {billingData.map((bill) => {
            const { lateFee, daysLate } = computeLateFeeAndDays(bill);
            const totalDue = toNumber(bill.total_amount_due);
            bill.lateFee = lateFee;
            bill.daysLate = daysLate;

            return (
                <div key={bill.billing_id} className="bg-white shadow rounded-xl border">
                  {/* Header */}
                  <div className="px-6 py-5 border-b">
                    <div className="flex flex-wrap items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{bill.unit_name}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(bill.billing_period)}
                        </p>
                      </div>
                      <div className="flex items-center mt-2 sm:mt-0">
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            bill.status === "unpaid"
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                        }`}
                    >
                      {bill.status}
                    </span>
                        <span className="ml-2 text-xs text-gray-500">ID: {bill.billing_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">Amount Due</span>
                        <span className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(totalDue)}
                    </span>
                        {lateFee > 0 && (
                            <span className="text-xs text-red-500 mt-1">
                        Includes {formatCurrency(lateFee)} Late Fee
                      </span>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">Due Date</span>
                        <span className="mt-1 font-medium text-gray-900">
                              {formatDate(
                                  new Date(
                                      new Date().getFullYear(),
                                      new Date().getMonth(),
                                      bill.propertyConfig?.billingDueDay || 1
                                  )
                              )}
                    </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-500">Payment Status</span>
                        {bill.paid_at ? (
                            <span className="mt-1 font-medium text-green-600 flex items-center">
                        ✅ Paid on {formatDate(bill.paid_at)}
                      </span>
                        ) : (
                            <span className="mt-1 font-medium text-red-600 flex items-center">
                        ❌ Not yet paid
                      </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🏦 PDC Information */}
                  {bill.postDatedChecks && bill.postDatedChecks.length > 0 && (
                      <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
                          💳 Post-Dated Check Details
                        </h3>
                        <div className="divide-y divide-blue-100 rounded-lg border border-blue-200 bg-white">
                          {bill.postDatedChecks.map((pdc, idx) => (
                              <div key={idx} className="p-3 text-sm text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p>
                                    <span className="font-medium text-gray-900">{pdc.bank_name}</span>{" "}
                                    • Check No. <strong>{pdc.check_number}</strong>
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Issue Date: {formatDate(pdc.due_date)} | Amount:{" "}
                                    <span className="font-semibold">{formatCurrency(pdc.amount)}</span>
                                  </p>
                                </div>
                                <div className="mt-2 sm:mt-0">
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pdc.status === "cleared"
                        ? "bg-green-100 text-green-700"
                        : pdc.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : pdc.status === "bounced"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                }`}
            >
              {pdc.status}
            </span>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}


                  {/* Billing Breakdown */}
                  <div className="px-6 py-4">
                    <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                      Billing Breakdown
                    </h2>

                    <div className="divide-y divide-gray-200 rounded-lg border">
                      {/* Base Rent */}
                      <div className="flex justify-between items-center p-3">
                        <span className="text-sm text-gray-700">Base Rent</span>
                        <span className="text-sm font-semibold text-gray-900">
        {formatCurrency(bill.breakdown?.base_rent || 0)}
      </span>
                      </div>

                      {/* Advance Payment Deduction */}
                      {bill.breakdown?.is_advance_payment_paid &&
                          bill.breakdown?.advance_payment_required > 0 && (
                              <div className="flex justify-between items-center p-3 bg-yellow-50">
          <span className="text-sm text-gray-700">
            Advance Payment Deduction ({bill.breakdown.advance_months}{" "}
            {bill.breakdown.advance_months > 1 ? "months" : "month"})
          </span>
                                <span className="text-sm font-semibold text-red-600">
            -{formatCurrency(bill.breakdown.advance_payment_required)}
          </span>
                              </div>
                          )}

                      {/* 🧾 Late Fee (Always Visible) */}
                      <div className="flex justify-between items-center p-3 bg-rose-50">
      <span className="text-sm text-gray-700 flex items-center gap-1">
        Late Payment Penalty
        <span className="text-xs text-gray-500">
          ({bill.propertyConfig?.lateFeeType === "percentage"
            ? `${bill.propertyConfig?.lateFeeAmount}%`
            : `₱${bill.propertyConfig?.lateFeeAmount || 0}/day`}
          )
        </span>
      </span>
                        <span
                            className={`text-sm font-semibold ${
                                bill.lateFee > 0 ? "text-red-600" : "text-gray-700"
                            }`}
                        >
        {formatCurrency(bill.lateFee || 0)}
      </span>
                      </div>

                      {/* 📅 Days Late (Always Visible) */}
                      <div className="flex justify-between items-center p-3">
                        <span className="text-sm text-gray-700">Days Late</span>
                        <span
                            className={`text-sm font-semibold ${
                                bill.daysLate > 0 ? "text-red-600" : "text-gray-700"
                            }`}
                        >
        {bill.daysLate || 0} day{bill.daysLate === 1 ? "" : "s"}
      </span>
                      </div>
                    </div>

                    {/* Additional Charges / Discounts */}
                    {bill.billingAdditionalCharges?.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
                            Additional Charges or Discounts
                          </h3>
                          <div className="divide-y divide-gray-200 rounded-lg border">
                            {bill.billingAdditionalCharges.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="flex justify-between items-center p-3"
                                >
            <span className="text-sm text-gray-700">
              {c.charge_type}{" "}
              <span
                  className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.charge_category === "discount"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                  }`}
              >
                {c.charge_category}
              </span>
            </span>
                                  <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(c.amount)}
            </span>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Payment Buttons */}
                    {bill.status === "unpaid" && (
                        <div className="pt-4 border-t mt-4">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleMayaPayment(totalDue, bill.billing_id)}
                                disabled={loadingPayment}
                                className={`px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm text-white ${
                                    loadingPayment
                                        ? "bg-gray-400"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                              {loadingPayment ? "Processing..." : "Pay Now via Maya"}
                            </button>

                            <button
                                onClick={() => handlePaymentOptions(bill.billing_id, totalDue)}
                                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200"
                            >
                              Other Payment Options
                            </button>
                          </div>
                        </div>
                    )}

                    {/* Download PDF */}
                    <button
                        onClick={() =>
                            window.open(`/api/tenant/billing/${bill.billing_id}`, "_blank")
                        }
                        className="px-4 py-2.5 mt-3 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-sm hover:from-emerald-700 hover:to-green-800"
                    >
                      📄 Download Statement (PDF)
                    </button>
                  </div>


                </div>
            );
          })}
        </div>
      </div>
  );
}
