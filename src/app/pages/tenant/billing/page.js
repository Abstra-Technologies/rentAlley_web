"use client";

import Image from "next/image";
import { useState } from "react";
import { IoIosArrowBack, IoMdCloudUpload } from "react-icons/io";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";

import { useEffect } from "react";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function TenantBilling({}) {
  const [billingData, setBillingData] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const { user } = useAuth();
  const tenant_id = user?.tenant_id;
  const router = useRouter();

  useEffect(() => {
    if (!tenant_id) return;

    const fetchBillingData = async () => {
      try {
        const res = await axios.get(
          `/api/tenant/billing/view?tenant_id=${tenant_id}`
        );
        const billings = res.data.billings || [];
        const meterReadings = res.data.meterReadings || [];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const filteredBillings = billings.filter((bill) => {
          const billDate = new Date(bill.billing_period);
          return (
            billDate.getFullYear() === currentYear &&
            billDate.getMonth() + 1 === currentMonth
          );
        });

        setBillingData(filteredBillings);
        setMeterReadings(meterReadings);
        setLoading(false);
      } catch (err) {
        setError("No Billing Records Found.");
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [tenant_id]);

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
          tenant_id,
          payment_method_id: 1,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          redirectUrl: {
            success: "http://localhost:3000/pages/payment/billSuccess",
            failure: "http://localhost:3000/pages/payment/billFailed",
            cancel: "http://localhost:3000/pages/payment/billCancelled",
          },
        });

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        }
      } catch (error) {
        console.error("Payment error:", error);
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Failed to process payment. Please try again.",
        });
      }
    }
  };

  const handlePaymentOptions = () => {
    router.push("/pages/payment/proofOfPayment");
  };

  if (loading)
    return <p className="text-gray-500">Loading billing records...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (billingData.length === 0)
    return <p className="text-gray-500">No billing records found.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Current Billing</h1>
      {billingData.map((bill) => (
        <div
          key={bill.billing_id}
          className="p-4 border rounded-lg bg-white shadow-md mb-4"
        >
          <p>Billing DATA: {bill?.billing_id}</p>
          <h2 className="text-lg font-semibold">
            {bill.unit_name} - {bill.billing_period}
          </h2>
          <p className="text-gray-600">
            Status: <span className="font-bold">{bill.status}</span>
          </p>
          <p className="text-gray-600">
            Total Amount Due:{" "}
            <span className="font-bold">₱{bill.total_amount_due}</span>
          </p>
          <p className="text-gray-600">Due Date: {bill.due_date}</p>
          {bill.paid_at ? (
            <p className="text-green-600">Paid on: {bill.paid_at}</p>
          ) : (
            <p className="text-red-600">Not yet paid</p>
          )}

          <div className="mt-4">
            <h3 className="text-md font-semibold">Meter Readings</h3>
            {meterReadings
              .filter((reading) => reading.unit_id === bill.unit_id)
              .map((reading, index) => (
                <div
                  key={index}
                  className="mt-2 p-2 border bg-gray-100 rounded-lg"
                >
                  <p className="text-gray-700">
                    Utility: {reading.utility_type.toUpperCase()}
                  </p>
                  <p>Previous Reading: {reading.previous_reading}</p>
                  <p>Current Reading: {reading.current_reading}</p>
                  <p>Reading Date: {reading.reading_date}</p>
                </div>
              ))}
          </div>

          {bill.status === "unpaid" && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() =>
                  handleMayaPayment(bill?.total_amount_due, bill?.billing_id)
                }
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Pay Now via Maya
              </button>
              <button
                onClick={handlePaymentOptions}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Other Payment Options
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
