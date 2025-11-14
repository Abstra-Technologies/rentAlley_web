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
  if (loading) return <LoadingScreen message="Loading billing..." />;
  if (error)
    return <ErrorBoundary error={error} onRetry={() => location.reload()} />;

  if (!billingData.length)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ReceiptPercentIcon className="w-14 h-14 text-gray-400" />
        <p>No billing available.</p>
      </div>
    );

  /* ========================================================================== */
  /*                               UI RENDER                                    */
  /* ========================================================================== */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            Billing Statement
          </h1>
          <p className="text-sm text-gray-600">
            Review your detailed monthly billing
          </p>
        </header>

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
              (sum, p) => (p.status === "cleared" ? sum + toNumber(p.amount) : sum),
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
            <div key={bill.billing_id} className="bg-white border rounded-xl p-6 space-y-6 shadow-sm">
              
              {/* BILLING INFO HEADER */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Billing ID: <span className="font-medium text-gray-900">{bill.billing_id}</span></p>
                <p className="text-sm text-gray-600">Due Date: <span className="font-medium text-gray-900">{formatDate(bill.propertyConfig?.billingDueDay)}</span></p>
                <p className="text-sm text-gray-600">Payment Status: <span className="font-medium text-gray-900 capitalize">{bill.status}</span></p>
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-700">Total Amount Due</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDue)}</p>
              </div>

              {/* RENT BILLING ACCORDION */}
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

                <Row strong label="Rent Subtotal" value={formatCurrency(rentSubtotal)} />
              </Accordion>

              {/* PDC UNDER RENT */}
              {!!bill.postDatedChecks?.length && (
                <PostDatedCheckSection pdcs={bill.postDatedChecks} />
              )}

              {/* UTILITY BILLING ACCORDION */}
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
                <Row label="Electricity Bill" value={formatCurrency(elecAmt)} />

                <Row
                  strong
                  label="Utility Subtotal"
                  value={formatCurrency(utilitySubtotal)}
                />

                {/* METER READINGS INSIDE UTILITY ACCORDION */}
                <MeterReadingList
                  meterReadings={meterReadings}
                  billingData={billingData}
                />
              </Accordion>

              {/* PAYMENT BUTTONS */}
              {bill.status !== "paid" && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleMayaPayment(totalDue, bill.billing_id)}
                    className="w-full py-3 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    <CreditCardIcon className="w-5 h-5 inline mr-2" /> Pay with Maya
                  </button>

                  <button
                    onClick={() => handleUploadProof(bill.billing_id, totalDue)}
                    className="w-full py-3 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
                    Upload Proof of Payment
                  </button>
                </div>
              )}

              {!bill.isDefaultBilling && (
                <button
                  onClick={() => window.open(`/api/tenant/billing/${bill.billing_id}`)}
                  className="w-full py-3 border rounded-lg font-medium hover:bg-gray-50"
                >
                  Download Billing PDF
                </button>
              )}
              
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*                               SUBCOMPONENTS                                */
/* ========================================================================== */

function Accordion({ title, open, amount, onToggle, children }) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-2 font-semibold text-gray-900"
      >
        <span>{title}</span>
        <span className="font-bold">{formatCurrency(amount)}</span>
        <span className="ml-2 text-gray-500">{open ? "−" : "+"}</span>
      </button>

      {open && <div className="border rounded-lg divide-y">{children}</div>}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between p-3 text-sm">
      <span className={strong ? "font-semibold" : "text-gray-700"}>
        {label}
      </span>
      <span className={strong ? "font-bold text-gray-900" : "text-gray-900"}>
        {value}
      </span>
    </div>
  );
}

function PostDatedCheckSection({ pdcs }) {
  return (
    <div className="space-y-2 mt-3">
      <p className="font-semibold text-gray-900">Post-Dated Checks</p>
      {pdcs.map((pdc, i) => (
        <div key={i} className="border-b pb-2 text-sm">
          <p className="font-medium">{pdc.bank_name}</p>
          <p className="text-gray-600">Check No: {pdc.check_number}</p>
          <p className="text-gray-500">
            Due {formatDate(pdc.due_date)} • {formatCurrency(pdc.amount)}
          </p>
          <p className="text-gray-700 capitalize">Status: {pdc.status}</p>
        </div>
      ))}
    </div>
  );
}

function MeterReadingList({ meterReadings, billingData }) {
  const now = new Date();
  const filtered = meterReadings.filter((r) => {
    const d = new Date(r.reading_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  if (!filtered.length)
    return <p className="text-sm text-gray-500 p-3">No meter readings this month.</p>;

  return (
    <div className="space-y-2 p-2">
      <p className="font-semibold text-gray-900">Meter Readings (Current Month)</p>

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
          <div key={i} className="border-b pb-2 text-sm">
            <div className="flex justify-between">
              <span className="capitalize font-medium">{reading.utility_type}</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <p className="text-gray-600 mt-1">
              Previous {prev} → Current {curr}
            </p>
            <p className="text-gray-500 text-xs">
              {usage} × ₱{rate}
            </p>
          </div>
        );
      })}
    </div>
  );
}
