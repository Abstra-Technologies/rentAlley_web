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
  ReceiptPercentIcon,
  CreditCardIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/* ========================================================================== */
/*                                 MAIN COMPONENT                             */
/* ========================================================================== */
export default function TenantBilling({ agreement_id, user_id }) {
  const [billingData, setBillingData] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  /* ---------------------------- FETCH BILLING ----------------------------- */
  useEffect(() => {
    if (!user_id) return;

    const fetchBilling = async () => {
      try {
        const res = await axios.get("/api/tenant/billing/viewCurrentBilling", {
          params: { agreement_id, user_id },
        });

        const bill = res.data.billing;
        if (bill) {
          bill.showRent = true;
          bill.showUtility = true;
        }

        const pdc = res.data.postDatedChecks || [];

        setBillingData([
          {
            ...bill,
            billingAdditionalCharges: res.data.billingAdditionalCharges || [],
            leaseAdditionalExpenses: res.data.leaseAdditionalExpenses || [],
            breakdown: res.data.breakdown || {},
            propertyBillingTypes: res.data.propertyBillingTypes || {},
            propertyConfig: res.data.propertyConfig || {},
            postDatedChecks: pdc,
          },
        ]);

        setMeterReadings([
          ...(res.data.meterReadings?.water || []),
          ...(res.data.meterReadings?.electricity || []),
        ]);
      } catch (e) {
        setError("Failed to fetch billing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [agreement_id, user_id]);

  /* ---------------------------- COMPUTE LATE FEES ----------------------------- */
  const computeLate = (bill) => {
    const config = bill.propertyConfig;
    if (!config || bill.status === "paid") return { lateFee: 0, daysLate: 0 };

    const dueDay = Number(config.billingDueDay || 1);
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));

    if (diff <= Number(config.gracePeriodDays || 0))
      return { lateFee: 0, daysLate: 0 };

    const daysLate = diff - Number(config.gracePeriodDays || 0);
    const lateFee =
      config.lateFeeType === "percentage"
        ? (Number(bill.breakdown?.base_rent || 0) *
            Number(config.lateFeeAmount || 0)) /
          100
        : Number(config.lateFeeAmount || 0) * Math.max(daysLate, 1);

    return { lateFee, daysLate };
  };

  /* ---------------------------- PAYMENT ------------------------------------ */
  const handleMayaPayment = async (amount, billing_id) => {
    const confirm = await Swal.fire({
      title: "Pay via Maya?",
      text: "Do you want to proceed?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    setLoadingPayment(true);
    try {
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
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleUploadProof = (billing_id, amount) => {
    router.push(
      `/pages/payment/proofOfPayment?agreement_id=${agreement_id}&amountPaid=${amount}&billingId=${billing_id}`
    );
  };

  /* ---------------------------- STATES ---------------------------- */
  if (loading) {
    return (
      <div className="space-y-4 md:space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
          <div className="p-4 md:p-5 border-b-2 border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 md:p-5 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>

          <div className="p-4 md:p-5 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>

          <div className="p-4 md:p-5 border-t border-gray-200 space-y-3">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (error)
    return <ErrorBoundary error={error} onRetry={() => location.reload()} />;

  if (!billingData.length)
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <ReceiptPercentIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Billing Available
        </h3>
        <p className="text-gray-600">
          Your billing information will appear here once available.
        </p>
      </div>
    );

  /* ========================================================================== */
  /*                               UI RENDER                                    */
  /* ========================================================================== */

  return (
    <div className="space-y-4 md:space-y-3">
      {billingData.map((bill) => {
        const { lateFee, daysLate } = computeLate(bill);

        const baseRent = toNumber(bill.breakdown?.base_rent);
        const waterAmt = toNumber(bill.total_water_amount);
        const elecAmt = toNumber(bill.total_electricity_amount);

        const advancePayment = bill.breakdown?.is_advance_payment_paid
          ? toNumber(bill.breakdown.advance_payment_required)
          : 0;

        const additionalCharges = (bill.billingAdditionalCharges || []).reduce(
          (sum, c) =>
            c.charge_category === "discount"
              ? sum - toNumber(c.amount)
              : sum + toNumber(c.amount),
          0
        );

        const clearedPdcTotal =
          bill.postDatedChecks?.reduce(
            (sum, p) =>
              p.status === "cleared" ? sum + toNumber(p.amount) : sum,
            0
          ) || 0;

        const rentSubtotal =
          baseRent +
          additionalCharges -
          advancePayment +
          lateFee -
          clearedPdcTotal;

        const utilitySubtotal = waterAmt + elecAmt;

        const totalDue = rentSubtotal + utilitySubtotal;

        /* ---------------------------- UI BLOCK ---------------------------- */

        return (
          <div
            key={bill.billing_id}
            className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
          >
            {/* Header Section */}
            <div className="p-4 md:p-5 border-b-2 border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Billing ID */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <ReceiptPercentIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Billing ID
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    #{bill.billing_id || "N/A"}
                  </p>
                </div>

                {/* Due Date */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Due Date
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {bill.propertyConfig?.billingDueDay
                      ? formatDate(bill.propertyConfig.billingDueDay)
                      : "N/A"}
                  </p>
                </div>

                {/* Payment Status */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <ClockIcon className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Payment Status
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                      bill.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {(bill.status || "pending").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Amount Due */}
            <div className="p-4 md:p-5 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="w-6 h-6 text-blue-600" />
                  <p className="text-base sm:text-lg font-bold text-gray-700">
                    Total Amount Due
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(totalDue)}
                </p>
              </div>
            </div>

            {/* Rent Billing Accordion */}
            <div className="p-4 md:p-5">
              <Accordion
                title="Rent Billing"
                open={bill.showRent}
                amount={rentSubtotal}
                onToggle={() => {
                  bill.showRent = !bill.showRent;
                  setBillingData([...billingData]);
                }}
              >
                <Row label="Base Rent" value={formatCurrency(baseRent)} />

                {bill.billingAdditionalCharges?.map((c, i) => (
                  <Row
                    key={i}
                    label={c.charge_type}
                    value={
                      c.charge_category === "discount"
                        ? `-${formatCurrency(c.amount)}`
                        : formatCurrency(c.amount)
                    }
                  />
                ))}

                {advancePayment > 0 && (
                  <Row
                    label="Advance Payment"
                    value={`-${formatCurrency(advancePayment)}`}
                  />
                )}

                {lateFee > 0 && (
                  <Row label="Late Fee" value={formatCurrency(lateFee)} />
                )}

                {clearedPdcTotal > 0 && (
                  <Row
                    label="Cleared PDC"
                    value={`-${formatCurrency(clearedPdcTotal)}`}
                  />
                )}

                <Row
                  strong
                  label="Rent Subtotal"
                  value={formatCurrency(rentSubtotal)}
                />
              </Accordion>

              {/* PDC Section */}
              {!!bill.postDatedChecks?.length && (
                <div className="mt-4">
                  <PostDatedCheckSection pdcs={bill.postDatedChecks} />
                </div>
              )}

              {/* Utility Billing Accordion */}
              <div className="mt-4">
                <Accordion
                  title="Utility Billing"
                  open={bill.showUtility}
                  amount={utilitySubtotal}
                  onToggle={() => {
                    bill.showUtility = !bill.showUtility;
                    setBillingData([...billingData]);
                  }}
                >
                  <Row label="Water Bill" value={formatCurrency(waterAmt)} />
                  <Row
                    label="Electricity Bill"
                    value={formatCurrency(elecAmt)}
                  />

                  <Row
                    strong
                    label="Utility Subtotal"
                    value={formatCurrency(utilitySubtotal)}
                  />

                  {/* Meter Readings */}
                  <MeterReadingList
                    meterReadings={meterReadings}
                    billingData={billingData}
                  />
                </Accordion>
              </div>
            </div>

            {/* Payment Buttons */}
            {bill.status !== "paid" && (
              <div className="p-4 md:p-5 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => handleMayaPayment(totalDue, bill.billing_id)}
                  disabled={loadingPayment}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="w-5 h-5" />
                      <span>Pay with Maya</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleUploadProof(bill.billing_id, totalDue)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 rounded-xl font-bold transition-all shadow-sm"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Upload Proof of Payment</span>
                </button>
              </div>
            )}

            {/* Download PDF Button */}
            {!bill.isDefaultBilling && (
              <div className="p-4 md:p-5 pt-0">
                <button
                  onClick={() =>
                    window.open(`/api/tenant/billing/${bill.billing_id}`)
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 rounded-xl font-bold transition-all shadow-sm"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>Download Billing PDF</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/*                               SUBCOMPONENTS                                */
/* ========================================================================== */

function Accordion({ title, open, amount, onToggle, children }) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all font-bold text-gray-900 border-2 border-gray-200"
      >
        <span className="text-sm sm:text-base">{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg font-bold">
            {formatCurrency(amount)}
          </span>
          {open ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-2 border-gray-200 rounded-xl divide-y divide-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between items-center p-3 sm:p-4">
      <span
        className={`text-sm ${
          strong ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${
          strong ? "font-bold text-gray-900" : "font-semibold text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PostDatedCheckSection({ pdcs }) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
      <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <CreditCardIcon className="w-5 h-5 text-blue-600" />
        Post-Dated Checks
      </p>
      <div className="space-y-3">
        {pdcs.map((pdc, i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-3 border border-blue-100"
          >
            <p className="font-semibold text-gray-900">{pdc.bank_name}</p>
            <p className="text-sm text-gray-600 mt-1">
              Check No: {pdc.check_number}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                Due {formatDate(pdc.due_date)}
              </p>
              <p className="font-bold text-gray-900">
                {formatCurrency(pdc.amount)}
              </p>
            </div>
            <p className="text-xs text-gray-700 capitalize mt-1">
              Status: {pdc.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeterReadingList({ meterReadings, billingData }) {
  const now = new Date();
  const filtered = meterReadings.filter((r) => {
    const d = new Date(r.reading_date);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  if (!filtered.length)
    return (
      <div className="p-3 sm:p-4 bg-gray-50">
        <p className="text-sm text-gray-500">No meter readings this month.</p>
      </div>
    );

  return (
    <div className="bg-gray-50 p-3 sm:p-4">
      <p className="font-bold text-gray-900 mb-3">
        Meter Readings (Current Month)
      </p>

      <div className="space-y-3">
        {filtered.map((reading, i) => {
          const prev = Number(reading.previous_reading || 0);
          const curr = Number(reading.current_reading || 0);
          const usage = Math.max(curr - prev, 0);

          const rate =
            reading.utility_type === "water"
              ? billingData[0]?.propertyBillingTypes?.water_rate || 0
              : billingData[0]?.propertyBillingTypes?.electricity_rate || 0;

          const total = usage * rate;

          return (
            <div
              key={i}
              className="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="capitalize font-semibold text-gray-900">
                  {reading.utility_type}
                </span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Previous {prev} → Current {curr}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {usage} × ₱{rate}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
