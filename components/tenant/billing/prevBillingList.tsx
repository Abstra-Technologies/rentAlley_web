"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDate, formatCurrency } from "@/utils/formatter/formatters";
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";

export default function PreviousBilling({ agreement_id, user_id }) {
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchBillingData = async () => {
      try {
        const res = await axios.get("/api/tenant/billing/previousBilling", {
          params: { agreement_id, user_id },
        });
        setBillingData(res.data.billings || []);
      } catch (err) {
        console.error("Error fetching previous billing:", err);
        setError("Failed to fetch previous billing.");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [agreement_id, user_id]);

  /**
   * Generate & download PDF on demand.
   */
  const handleDownload = async (billing_id: string) => {
    setDownloadingId(billing_id);
    try {
      const res = await axios.get(`/api/tenant/billing/${billing_id}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Billing_${billing_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate billing PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">
          Loading previous billing records...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-red-900">Error Loading Data</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );

  if (!billingData.length)
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <FolderOpenIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No Previous Billing Records
        </h3>
        <p className="text-sm text-gray-600">
          Your billing history will appear here once available.
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
          <ClockIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
          <p className="text-sm text-gray-600">
            {billingData.length} previous{" "}
            {billingData.length === 1 ? "record" : "records"}
          </p>
        </div>
      </div>

      {/* Billing List */}
      <div className="grid gap-4">
        {billingData.map((bill) => (
          <div
            key={bill.billing_id}
            className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Side - Billing Info */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Billing ID */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Billing ID
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      #{bill.billing_id}
                    </p>
                  </div>

                  {/* Billing Period */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Period
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(bill.billing_period)}
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <BanknotesIcon className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Amount
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(bill.total_amount_due || 0)}
                    </p>
                  </div>
                </div>

                {/* Right Side - Action Button */}
                <button
                  onClick={() => handleDownload(bill.billing_id)}
                  disabled={downloadingId === bill.billing_id}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed lg:w-auto"
                >
                  {downloadingId === bill.billing_id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="w-5 h-5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="font-semibold text-emerald-700">Paid</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Statement available for download
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
