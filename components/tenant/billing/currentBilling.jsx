"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
  formatDate,
  formatCurrency,
  toNumber,
} from "@/utils/formatter/formatters";
import useAuthStore from "../../../zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import ErrorBoundary from "@/components/Commons/ErrorBoundary";
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  BoltIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

/**
 * TenantBilling Component
 * - Shows rent and utility billing
 * - Mobile-first layout with responsive columns
 * - Always display rent; adjust payable if PDC cleared
 */
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
                billingAdditionalCharges:
                  res.data.billingAdditionalCharges || [],
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

  const hasClearedRentPDC = (bill) =>
    bill.postDatedChecks?.some((pdc) => pdc.status === "cleared");
  const hasPendingPDC = (bill) =>
    bill.postDatedChecks?.some(
      (pdc) => pdc.status === "pending" || pdc.status === "processing"
    );
  const isPaymentProcessing = (bill) =>
    hasPendingPDC(bill) ||
    bill.status === "processing" ||
    bill.status === "verifying";

  const computeLateFeeAndDays = (bill) => {
    const config = bill.propertyConfig;
    if (!config || bill.status === "paid") return { lateFee: 0, daysLate: 0 };

    const billingDueDay = Number(config.billingDueDay || 1);
    const today = new Date();
    const dueDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      billingDueDay
    );
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
    if (!result.isConfirmed) return;

    setLoadingPayment(true);
    try {
      // ✅ Force proper formatting: number with 2 decimal digits
      const formattedAmount = parseFloat(Number(amount).toFixed(2));

      const res = await axios.post("/api/tenant/billing/payment", {
        amount: formattedAmount,
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
      console.error("❌ Payment error:", error?.response?.data || error);
      Swal.fire(
          "Payment Failed",
          error?.response?.data?.message ||
          "Failed to process payment. Please try again.",
          "error"
      );
    } finally {
      setLoadingPayment(false);
    }
  };

  const handlePaymentOptions = (billing_id, amount) => {
    if (!agreement_id)
      return Swal.fire("Error", "Agreement details not found.", "error");
    router.push(
      `/pages/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${amount}&billingId=${billing_id}`
    );
  };

  if (loading) {
    return (
      <LoadingScreen message="Fetching your billing data, please wait..." />
    );
  }

  if (error)
    return (
      <ErrorBoundary
        error={error.message || "Failed to load data. Please try again later."}
        onRetry={() => window.location.reload()}
      />
    );

  if (!Array.isArray(billingData) || billingData.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ReceiptPercentIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Billing Records
          </h3>
          <p className="text-gray-600">
            No billing information is currently available for your account.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl">
              <ReceiptPercentIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Billing Statement
              </h1>
              <p className="text-sm text-gray-600">
                Current billing period details
              </p>
            </div>
          </div>
        </div>

        {billingData.map((bill) => {
          const { lateFee, daysLate } = computeLateFeeAndDays(bill);
          bill.lateFee = lateFee;
          bill.daysLate = daysLate;

          const baseRent = toNumber(bill.breakdown?.base_rent);
          const waterAmt = toNumber(bill.total_water_amount || 0);
          const elecAmt = toNumber(bill.total_electricity_amount || 0);
          const leaseMonthlyExtras = (
            bill.leaseAdditionalExpenses || []
          ).reduce(
            (sum, e) =>
              e.frequency === "monthly" ? sum + toNumber(e.amount) : sum,
            0
          );
          const advancePayment =
            bill.breakdown?.is_advance_payment_paid &&
            bill.breakdown?.advance_payment_required > 0
              ? toNumber(bill.breakdown.advance_payment_required)
              : 0;
          const additionalCharges = (
            bill.billingAdditionalCharges || []
          ).reduce(
            (sum, c) =>
              c.charge_category === "discount"
                ? sum - toNumber(c.amount)
                : sum + toNumber(c.amount),
            0
          );

          const subtotal =
            baseRent +
            waterAmt +
            elecAmt +
            leaseMonthlyExtras +
            additionalCharges -
            advancePayment +
            lateFee;

          const hasCleared = hasClearedRentPDC(bill);
          // If there are cleared PDCs, deduct their total cleared amount
          const clearedPdcTotal = bill.postDatedChecks
              ?.filter((pdc) => pdc.status === "cleared")
              .reduce((sum, pdc) => sum + toNumber(pdc.amount), 0) || 0;

          const adjustedTotalDue = subtotal - clearedPdcTotal;


          const submetered =
            bill.propertyBillingTypes?.water_billing_type === "submetered" ||
            bill.propertyBillingTypes?.electricity_billing_type ===
              "submetered";

          const isPaid = bill.status === "paid";
          const isProcessing = isPaymentProcessing(bill);

          return (
            <div key={bill.billing_id} className="space-y-6">
              {/* Status Banner */}
              {isPaid && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-900">
                        Payment Complete
                      </h3>
                      <p className="text-sm text-emerald-700">
                        This billing statement has been paid in full
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <ClockIcon className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900">
                        Payment Processing
                      </h3>
                      <p className="text-sm text-amber-700">
                        Your payment is being verified. This may take 1-2
                        business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {bill.payment_status === "pending" && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <ClockIcon className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-indigo-900">
                          Waiting for Landlord Confirmation
                        </h3>
                        <p className="text-sm text-indigo-700">
                          Your proof of payment has been submitted. The landlord will review and confirm it shortly.
                        </p>
                      </div>
                    </div>
                  </div>
              )}


              {daysLate > 0 && !isPaid && !isProcessing && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900">
                        Payment Overdue
                      </h3>
                      <p className="text-sm text-red-700">
                        Your payment is {daysLate} day{daysLate > 1 ? "s" : ""}{" "}
                        overdue. Late fee of {formatCurrency(lateFee)} has been
                        applied.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Due Card */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <BanknotesIcon className="w-8 h-8" />
                      <h2 className="text-xl font-bold">Total Amount Due</h2>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">Billing Period: {" "}
                        {new Date(bill.billing_period).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-5xl sm:text-6xl font-bold mb-2">
                    {formatCurrency(adjustedTotalDue)}
                  </div>
                  {hasCleared && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-300/30 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        Rent covered by Post-Dated Check
                      </span>
                    </div>
                  )}
                </div>

                {/* Breakdown */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Billing Breakdown
                  </h3>
                  <BillingBreakdown
                      bill={bill}
                      baseRent={baseRent}
                      advancePayment={advancePayment}
                      lateFee={lateFee}
                      subtotal={subtotal}
                      adjustedTotal={adjustedTotalDue}
                  />

                </div>
              </div>

              {/* Post-Dated Checks */}
              {bill.postDatedChecks?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCardIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Post-Dated Check Details
                    </h3>
                  </div>
                  <PostDatedCheckSection pdcs={bill.postDatedChecks} />
                </div>
              )}

              {/* Meter Readings */}
              {submetered && meterReadings.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-emerald-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <BoltIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Utility Meter Readings
                    </h3>
                  </div>
                  <MeterReadingList
                    meterReadings={meterReadings}
                    billingData={billingData}
                  />
                </div>
              )}

              {/* Payment Actions */}
              {!isPaid && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Payment Options
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        handleMayaPayment(adjustedTotalDue, bill.billing_id)
                      }
                      disabled={isProcessing || loadingPayment}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="w-6 h-6" />
                          <span>Pay with Maya</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        handlePaymentOptions(bill.billing_id, adjustedTotalDue)
                      }
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DocumentArrowDownIcon className="w-6 h-6" />
                      <span>Upload Proof of Payment</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PDF Download Button - Only show if NOT default billing */}
              {!bill.isDefaultBilling && (
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6">
                  <button
                    onClick={() =>
                      window.open(
                        `/api/tenant/billing/${bill.billing_id}`,
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>Download Statement (PDF)</span>
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

function BillingBreakdown({
                            bill,
                            baseRent,
                            advancePayment,
                            lateFee,
                            subtotal,
                            adjustedTotal,
                          }) {
  const waterAmt = Number(bill.total_water_amount || 0);
  const elecAmt = Number(bill.total_electricity_amount || 0);
  const hasWater = waterAmt > 0;
  const hasElectricity = elecAmt > 0;

  // compute cleared PDC total for clarity
  const clearedPdcTotal =
      bill.postDatedChecks
          ?.filter((pdc) => pdc.status === "cleared")
          .reduce((sum, pdc) => sum + Number(pdc.amount || 0), 0) || 0;

  return (
      <div className="space-y-2">
        <BreakdownRow
            label="Base Rent"
            value={formatCurrency(baseRent)}
            icon="🏠"
        />

        {hasWater && (
            <BreakdownRow
                label="Water Bill"
                value={formatCurrency(waterAmt)}
                highlight="cyan"
                icon="💧"
            />
        )}

        {hasElectricity && (
            <BreakdownRow
                label="Electricity Bill"
                value={formatCurrency(elecAmt)}
                highlight="yellow"
                icon="⚡"
            />
        )}

        {bill.billingAdditionalCharges?.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Additional Items
              </p>
              {bill.billingAdditionalCharges.map((charge, idx) => (
                  <BreakdownRow
                      key={idx}
                      label={charge.charge_type || "Charge"}
                      value={
                        charge.charge_category === "discount"
                            ? `-${formatCurrency(charge.amount)}`
                            : formatCurrency(charge.amount)
                      }
                      highlight={
                        charge.charge_category === "discount" ? "green" : "gray"
                      }
                      badge={
                        charge.charge_category === "discount" ? "Discount" : "Charge"
                      }
                  />
              ))}
            </div>
        )}

        {advancePayment > 0 && (
            <BreakdownRow
                label="Advance Payment Deduction"
                value={`-${formatCurrency(advancePayment)}`}
                highlight="green"
                icon="💰"
            />
        )}

        {lateFee > 0 && (
            <BreakdownRow
                label="Late Payment Penalty"
                value={formatCurrency(lateFee)}
                highlight="red"
                icon="⚠️"
            />
        )}

        {/* If there are cleared PDCs, show the deduction line */}
        {clearedPdcTotal > 0 && (
            <BreakdownRow
                label="Cleared PDC Coverage"
                value={`-${formatCurrency(clearedPdcTotal)}`}
                highlight="green"
                icon="✅"
            />
        )}

        <div className="pt-3 border-t-2 border-gray-300">
          <BreakdownRow
              label="Total Amount Due"
              value={formatCurrency(adjustedTotal)}
              strong
          />
        </div>
      </div>
  );
}


function BreakdownRow({ label, value, highlight, strong, badge, icon }) {
  const bgColors = {
    cyan: "bg-cyan-50",
    yellow: "bg-amber-50",
    gray: "bg-gray-50",
    green: "bg-emerald-50",
    red: "bg-red-50",
  };

  const bg = bgColors[highlight] || "bg-white";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${bg} ${
        strong ? "border-2 border-blue-200" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <span
          className={`text-sm ${
            strong ? "font-bold text-gray-900" : "text-gray-700"
          }`}
        >
          {label}
        </span>
        {badge && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              badge === "Discount"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <span
        className={`text-sm ${
          strong
            ? "text-2xl font-bold text-blue-600"
            : "font-semibold text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PostDatedCheckSection({ pdcs }) {
  return (
    <div className="space-y-3">
      {pdcs.map((pdc, idx) => {
        const statusConfig = {
          cleared: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
          },
          pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
          },
          processing: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
          },
          bounced: {
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-200",
          },
        };

        const config = statusConfig[pdc.status] || {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border-2 ${config.border} ${config.bg}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-gray-900 mb-1">{pdc.bank_name}</p>
                <p className="text-sm text-gray-600">
                  Check No.{" "}
                  <span className="font-semibold">{pdc.check_number}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Due: {formatDate(pdc.due_date)} • {formatCurrency(pdc.amount)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}
              >
                {pdc.status === "cleared" && (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {pdc.status === "processing" && (
                  <ClockIcon className="w-4 h-4" />
                )}
                {pdc.status === "bounced" && (
                  <ExclamationTriangleIcon className="w-4 h-4" />
                )}
                <span className="capitalize">{pdc.status}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MeterReadingList({ meterReadings, billingData }) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // ✅ Filter readings for the current month and year
    const currentMonthReadings = meterReadings.filter((reading) => {
        const date = new Date(reading.reading_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // ✅ If there are no readings for this month
    if (!meterReadings || meterReadings.length === 0 || currentMonthReadings.length === 0) {
        return (
            <div className="p-6 text-center bg-gray-50 border-2 border-gray-200 rounded-2xl">
                <div className="flex flex-col items-center justify-center">
                    <BoltIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        No Meter Readings Yet
                    </h3>
                    <p className="text-sm text-gray-600">
                        The landlord has not yet set the meter readings for this month.
                    </p>
                </div>
            </div>
        );
    }

    // ✅ Otherwise, display readings for the current month
    const readingsToShow =
        currentMonthReadings.length > 0
            ? currentMonthReadings
            : [meterReadings[meterReadings.length - 1]];

    return (
        <div className="space-y-3">
            {readingsToShow.map((reading, idx) => {
                const prev = Number(reading.previous_reading || 0);
                const curr = Number(reading.current_reading || 0);
                const usage = Math.max(curr - prev, 0);
                const rate =
                    reading.utility_type === "water"
                        ? Number(billingData[0]?.propertyBillingTypes?.water_rate || 0)
                        : Number(
                            billingData[0]?.propertyBillingTypes?.electricity_rate || 0
                        );
                const total = usage * rate;
                const isWater = reading.utility_type === "water";

                return (
                    <div
                        key={idx}
                        className={`p-4 rounded-xl border-2 ${
                            isWater
                                ? "bg-cyan-50 border-cyan-200"
                                : "bg-amber-50 border-amber-200"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{isWater ? "💧" : "⚡"}</span>
                                    <h4 className="font-bold text-gray-900 capitalize">
                                        {reading.utility_type}
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                    Reading Date: {formatDate(reading.reading_date)}
                                </p>
                                <p className="text-xs text-gray-500">(Current Month Reading)</p>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Previous:{" "}
                      <span className="font-semibold text-gray-900">{prev}</span>
                  </span>
                                    <ChevronRightIcon className="w-4 h-4" />
                                    <span>
                    Current:{" "}
                                        <span className="font-semibold text-gray-900">{curr}</span>
                  </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900 mb-1">
                                    {formatCurrency(total)}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {usage.toFixed(2)} × ₱{rate.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
