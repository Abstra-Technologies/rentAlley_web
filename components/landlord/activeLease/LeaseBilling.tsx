"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  FileDown,
  Receipt,
  Loader2,
  Calendar,
  Search,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

interface Billing {
  billing_id: number;
  billing_period: string;
  total_amount_due: number;
  status: string;
  due_date: string;
  created_at?: string;
}

interface LeaseBillingProps {
  lease_id?: string;
  tenant_email?: string;
}

export default function LeaseBilling({ lease_id }: LeaseBillingProps) {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!lease_id) return;

    const fetchBillings = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/api/tenant/billing/previousBilling`, {
          params: { agreement_id: lease_id },
        });

        setBillings(res.data.billings || []);
      } catch (err: any) {
        console.error("❌ Error fetching billing statements:", err);
        Swal.fire("Error", "Failed to fetch billing statements.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchBillings();
  }, [lease_id]);

  const handleDownload = async (billing_id: number) => {
    setDownloading(billing_id);
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
      Swal.fire("Error", "Failed to generate billing PDF.", "error");
    } finally {
      setDownloading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₱${Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      paid: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      },
      unpaid: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      },
      overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      partial: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    };
    return configs[status?.toLowerCase()] || configs.unpaid;
  };

  // Filter billings
  const filteredBillings = billings.filter((bill) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.billing_period?.toLowerCase().includes(query) ||
      bill.status?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-blue-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-600">Loading billing statements...</p>
      </div>
    );
  }

  if (billings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-5">
          <Receipt className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
          No Billing Statements
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Once a billing cycle is generated, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">
              Billing Statements
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            {filteredBillings.length} statement
            {filteredBillings.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search billing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Billing Period
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBillings.map((bill, index) => {
                const statusConfig = getStatusConfig(bill.status);
                return (
                  <tr
                    key={bill.billing_id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {bill.billing_period}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(bill.total_amount_due)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(bill.due_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDownload(bill.billing_id)}
                        disabled={downloading === bill.billing_id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          downloading === bill.billing_id
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                      >
                        {downloading === bill.billing_id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4" />
                            Download
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-3">
        {filteredBillings.map((bill) => {
          const statusConfig = getStatusConfig(bill.status);
          return (
            <div
              key={bill.billing_id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Billing Period</p>
                  <p className="text-base font-bold text-gray-900">
                    {bill.billing_period}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusConfig.bg} ${statusConfig.text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {bill.status}
                </span>
              </div>

              {/* Amount */}
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {formatCurrency(bill.total_amount_due)}
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4 text-gray-400" />
                Due: {formatDate(bill.due_date)}
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(bill.billing_id)}
                disabled={downloading === bill.billing_id}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  downloading === bill.billing_id
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
                }`}
              >
                {downloading === bill.billing_id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filteredBillings.length === 0 && billings.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No billing statements match your search.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
