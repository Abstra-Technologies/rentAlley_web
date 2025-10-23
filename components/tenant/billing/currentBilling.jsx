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
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user_id) return;

    const fetchBillingData = async () => {
      try {
        const res = await axios.get(`/api/tenant/billing/viewCurrentBilling`, {
          params: { agreement_id, user_id },
        });

        const pdcChecks = res.data.postDatedChecks || [];
        const billings = res.data.billing
            ? [
              {
                ...res.data.billing,
                billingAdditionalCharges: res.data.billingAdditionalCharges || [],
                leaseAdditionalExpenses: res.data.leaseAdditionalExpenses || [],
                breakdown: res.data.breakdown || {},
                propertyBillingTypes: res.data.propertyBillingTypes || {},
                propertyConfig: res.data.propertyConfig || {},
                postDatedChecks: pdcChecks,
              },
            ]
            : [];

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
    const dueDate = new Date(today.getFullYear(), today.getMonth(), billingDueDay);
    const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

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
      lateFee = Number(config.lateFeeAmount || 0) * Math.max(daysLate, 1);
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

        if (res.data.checkoutUrl) window.location.href = res.data.checkoutUrl;
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

  const hasPendingPDC = (bill) =>
      bill.postDatedChecks?.some((pdc) => pdc.status === "pending" || pdc.status === "processing");

  const isPaymentProcessing = (bill) =>
      hasPendingPDC(bill) ||
      bill.status === "processing" ||
      bill.status === "verifying";

  if (loading)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
          <LoadingScreen message="Fetching your billing data, please wait..." />
        </div>
    );

  if (error)
    return (
        <ErrorBoundary
            error={
                error.message ||
                "Failed to load data. Please check your internet connection or try again."
            }
            onRetry={() => window.location.reload()}
        />
    );

  if (!Array.isArray(billingData) || billingData.length === 0)
    return (
        <div className="text-gray-500 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          No billing records found.
        </div>
    );

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
            bill.lateFee = lateFee;
            bill.daysLate = daysLate;

            const baseRent = toNumber(bill.breakdown?.base_rent);
            const advancePayment =
                bill.breakdown?.is_advance_payment_paid &&
                bill.breakdown?.advance_payment_required > 0
                    ? toNumber(bill.breakdown.advance_payment_required)
                    : 0;
            const additionalCharges = (bill.billingAdditionalCharges || []).reduce(
                (sum, c) => {
                  const amt = toNumber(c.amount);
                  return c.charge_category === "discount" ? sum - amt : sum + amt;
                },
                0
            );
            const subtotal = baseRent - advancePayment + lateFee + additionalCharges;
            const totalDue = toNumber(bill.total_amount_due);

            const isDefaultBilling = !bill.billing_id;
            const hasPendingChecks = hasPendingPDC(bill);
            const showProcessingBanner = isPaymentProcessing(bill);

            return (
                <div
                    key={bill.billing_id || "default"}
                    className="bg-white shadow rounded-xl border overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        Billing Statement for Unit {bill.unit_name || "Current Unit"}
                      </h2>
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
                      {bill.billing_id && (
                          <span className="ml-2 text-xs text-gray-500">
                      ID: {bill.billing_id}
                    </span>
                      )}
                    </div>
                  </div>

                  {/* ℹ️ Pending PDC Info */}
                  {hasPendingChecks && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 text-sm sm:text-base">
                        💡 One or more post-dated checks are still pending or being processed.
                        Please wait for your landlord’s confirmation.
                      </div>
                  )}

                  {/* 🟦 Payment Processing Notice */}
                  {showProcessingBanner && !hasPendingChecks && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 text-sm sm:text-base">
                        ℹ️ A payment has been made and is currently under review or pending
                        clearance. Please wait for confirmation from your landlord.
                      </div>
                  )}

                  {/* ⚠️ Default Billing Warning */}
                  {isDefaultBilling && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 text-sm sm:text-base">
                        ⚠️ This is a default billing record (system generated). The landlord has
                        not yet finalized this month's billing or added any additional charges.
                      </div>
                  )}

                  {/* Amounts */}
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">Amount Due</span>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                          {formatCurrency(totalDue)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500">Due Date</span>
                        <div className="mt-1 font-medium text-gray-900">
                          {formatDate(
                              new Date(
                                  new Date().getFullYear(),
                                  new Date().getMonth(),
                                  bill.propertyConfig?.billingDueDay || 1
                              )
                          )}
                        </div>
                      </div>
                      <div>
                    <span className="text-xs font-semibold text-gray-500">
                      Payment Status
                    </span>
                        {bill.paid_at ? (
                            <div className="mt-1 font-medium text-green-600">
                              ✅ Paid on {formatDate(bill.paid_at)}
                            </div>
                        ) : (
                            <div className="mt-1 font-medium text-red-600">❌ Not yet paid</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🧾 Billing Breakdown */}
                  <BillingBreakdown
                      bill={bill}
                      baseRent={baseRent}
                      advancePayment={advancePayment}
                      lateFee={lateFee}
                      subtotal={subtotal}
                  />

                  {/* 🏦 PDC Section */}
                  {bill.postDatedChecks && bill.postDatedChecks.length > 0 && (
                      <PostDatedCheckSection pdcs={bill.postDatedChecks} />
                  )}

                  {/* 💳 Payment Buttons */}
                  {bill.status === "unpaid" && (
                      <div className="px-6 pb-5 pt-4 border-t">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                              onClick={() => handleMayaPayment(totalDue, bill.billing_id)}
                              disabled={loadingPayment}
                              className={`px-4 py-2.5 text-sm font-medium rounded-lg text-white shadow-sm ${
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

                  {/* 📄 PDF Button */}
                  {!isDefaultBilling && (
                      <div className="px-6 pb-5">
                        <button
                            onClick={() =>
                                window.open(`/api/tenant/billing/${bill.billing_id}`, "_blank")
                            }
                            className="px-4 py-2.5 w-full sm:w-auto mt-3 text-sm font-medium rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-sm hover:from-emerald-700 hover:to-green-800"
                        >
                          📄 Download Statement (PDF)
                        </button>
                      </div>
                  )}
                </div>
            );
          })}
        </div>
      </div>
  );
}

/* --- Subcomponents --- */
function BillingBreakdown({ bill, baseRent, advancePayment, lateFee, subtotal }) {
  return (
      <div className="px-4 sm:px-6 py-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
          Billing Breakdown
        </h2>
        <div className="divide-y divide-gray-200 rounded-lg border bg-white">
          <BreakdownRow label="Base Rent" value={formatCurrency(baseRent)} />
          {advancePayment > 0 && (
              <BreakdownRow
                  label={`Advance Payment Deduction (${bill.breakdown?.advance_months} month${
                      bill.breakdown?.advance_months > 1 ? "s" : ""
                  })`}
                  value={`-${formatCurrency(advancePayment)}`}
                  highlight="yellow"
              />
          )}
          <BreakdownRow
              label="Late Payment Penalty"
              note={
                bill.propertyConfig?.lateFeeType === "percentage"
                    ? `${bill.propertyConfig?.lateFeeAmount}%`
                    : `₱${bill.propertyConfig?.lateFeeAmount || 0}/day`
              }
              value={formatCurrency(lateFee)}
              highlight="rose"
          />
          <BreakdownRow
              label="Days Late"
              value={`${bill.daysLate || 0} day${bill.daysLate === 1 ? "" : "s"}`}
          />
          {bill.billingAdditionalCharges?.map((c, idx) => (
              <BreakdownRow
                  key={idx}
                  label={c.charge_type}
                  badge={c.charge_category}
                  value={formatCurrency(c.amount)}
                  highlight="gray"
              />
          ))}
          <BreakdownRow
              label="Subtotal"
              value={formatCurrency(subtotal)}
              highlight="blue"
              strong
          />
        </div>
      </div>
  );
}

function BreakdownRow({ label, value, note, badge, highlight, strong }) {
  const bg =
      highlight === "blue"
          ? "bg-blue-50"
          : highlight === "rose"
              ? "bg-rose-50"
              : highlight === "yellow"
                  ? "bg-yellow-50"
                  : highlight === "gray"
                      ? "bg-gray-50"
                      : "bg-white";

  const textValue = strong
      ? "font-bold text-blue-700"
      : "font-semibold text-gray-900";

  return (
      <div className={`flex justify-between items-center p-3 sm:p-4 ${bg}`}>
        <div className="text-sm sm:text-base text-gray-700 flex flex-col sm:flex-row sm:items-center gap-1">
          {label}
          {note && <span className="text-xs text-gray-500">({note})</span>}
          {badge && (
              <span
                  className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      badge === "discount"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                  }`}
              >
            {badge}
          </span>
          )}
        </div>
        <span className={`text-sm sm:text-base ${textValue}`}>{value}</span>
      </div>
  );
}

function PostDatedCheckSection({ pdcs }) {
  return (
      <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
          💳 Post-Dated Check Details
        </h3>
        <div className="divide-y divide-blue-100 rounded-lg border border-blue-200 bg-white">
          {pdcs.map((pdc, idx) => (
              <div
                  key={idx}
                  className="p-3 text-sm text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
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
                              : pdc.status === "processing"
                                  ? "bg-blue-100 text-blue-700"
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
  );
}
