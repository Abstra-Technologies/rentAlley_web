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
  const [agreementId, setAgreementId] = useState(null);

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
        
        // Fetch agreement_id
        if (filteredBillings.length > 0) {
          try {
            const agreementRes = await axios.get(
              `/api/tenant/approved-tenant-property?tenantId=${tenant_id}`
            );
            if (agreementRes.data && agreementRes.data.agreement_id) {
              setAgreementId(agreementRes.data.agreement_id);
            }
          } catch (agreementErr) {
            console.error("Failed to fetch agreement ID:", agreementErr);
          }
        }
        
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
      } finally {
        setLoadingPayment(false);
      }
    }
  };

  const handlePaymentOptions = (billing_id, amount) => {
    if (!agreementId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not find your agreement details. Please try again later.",
      });
      return;
    }
    
    // Pass billing_id as a query parameter to handle this specific billing
    router.push(`/pages/payment/proofOfPayment?agreement_id=${agreementId}&amountPaid=${amount}&billingId=${billing_id}`);
  };

  if (loading)
    return <p className="text-gray-500">Loading billing records...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (billingData.length === 0)
    return <p className="text-gray-500">No billing records found.</p>;

  return (
    <TenantLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Your Current Billing</h1>
          <span className="hidden sm:inline-flex items-center px-3 py-1 mt-2 sm:mt-0 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {billingData.length} {billingData.length === 1 ? 'bill' : 'bills'}
          </span>
        </div>
        
        {billingData.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No billing information available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {billingData.map((bill) => (
              <div
                key={bill.billing_id}
                className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100"
              >
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-wrap items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {bill.unit_name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">{bill.billing_period}</p>
                    </div>
                    <div className="flex items-center mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        bill.status === 'unpaid' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">ID: {bill.billing_id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Amount Due</span>
                      <span className="mt-1 text-2xl font-bold text-gray-900">₱{parseFloat(bill.total_amount_due).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Due Date</span>
                      <span className="mt-1 font-medium text-gray-900">{bill.due_date}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Payment Status</span>
                      {bill.paid_at ? (
                        <span className="mt-1 font-medium text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Paid on {bill.paid_at}
                        </span>
                      ) : (
                        <span className="mt-1 font-medium text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Not yet paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Meter Readings</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {meterReadings
                        .filter((reading) => reading.unit_id === bill.unit_id)
                        .map((reading, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-150"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {reading.utility_type.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">{reading.reading_date}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-gray-500">Previous</p>
                                <p className="text-sm font-medium">{reading.previous_reading}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Current</p>
                                <p className="text-sm font-medium">{reading.current_reading}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
  
                  {bill.status === "unpaid" && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <button
                          onClick={() => handleMayaPayment(bill?.total_amount_due, bill?.billing_id)}
                          disabled={loadingPayment}
                          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            loadingPayment 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          } transition-colors duration-150`}
                        >
                          {loadingPayment ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Pay Now via Maya
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handlePaymentOptions(bill?.billing_id, bill?.total_amount_due)}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
                        >
                          <span className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                            Other Payment Options
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TenantLayout>
  );
}