"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  RefreshCcw,
  XCircle,
  Eye,
  X,
  FileText,
  Search,
  Building2,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";

interface PDC {
  pdc_id: number;
  check_number: string;
  bank_name: string;
  amount: number | string;
  due_date: string;
  status: "pending" | "cleared" | "bounced" | "replaced";
  uploaded_image_url?: string;
}

interface LeasePDCsProps {
  lease: {
    lease_id?: string;
    pdcs?: PDC[];
  };
}

export default function LeasePDCs({ lease }: LeasePDCsProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pdcList, setPdcList] = useState<PDC[]>(lease?.pdcs || []);
  const [selectedPDC, setSelectedPDC] = useState<PDC | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (lease?.pdcs) setPdcList(lease.pdcs);
  }, [lease]);

  const handleRefresh = async () => {
    if (!lease?.lease_id) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/leaseAgreement/getDetailedLeaseInfo/${lease.lease_id}`,
      );
      const data = await res.json();
      if (res.ok && data.pdcs) {
        setPdcList(data.pdcs);
        Swal.fire({
          icon: "success",
          title: "Refreshed",
          text: "PDC list updated successfully.",
          timer: 1200,
          showConfirmButton: false,
        });
      } else {
        Swal.fire("Error", "Failed to refresh PDC list.", "error");
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      Swal.fire("Error", "Failed to refresh PDC list.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (pdc_id: number, newStatus: string) => {
    if (!lease?.lease_id) return;

    const confirm = await Swal.fire({
      title: `Mark as ${newStatus}?`,
      text: `Are you sure you want to set this check's status to ${newStatus.toUpperCase()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, mark as ${newStatus}`,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/landlord/pdc/updateStatus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdc_id, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update PDC status");

      setPdcList((prev) =>
        prev.map((pdc) =>
          pdc.pdc_id === pdc_id ? { ...pdc, status: newStatus as any } : pdc,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `PDC marked as ${newStatus}.`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error updating PDC:", err);
      Swal.fire("Error", "Could not update PDC status.", "error");
    }
  };

  const handleView = (pdc: PDC) => {
    setSelectedPDC(pdc);
    setOpenModal(true);
  };

  const formatCurrency = (amount: number | string) => {
    return `₱${Number(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      cleared: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      },
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      },
      bounced: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      replaced: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    };
    return configs[status?.toLowerCase()] || configs.pending;
  };

  // Filter PDCs
  const filteredPDCs = pdcList.filter((pdc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      pdc.check_number?.toLowerCase().includes(query) ||
      pdc.bank_name?.toLowerCase().includes(query) ||
      pdc.status?.toLowerCase().includes(query)
    );
  });

  if (!pdcList || pdcList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-5">
          <FileText className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
          No Post-Dated Checks
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          There are currently no PDC records for this lease agreement.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">
                Post-Dated Checks
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              {filteredPDCs.length} check{filteredPDCs.length !== 1 ? "s" : ""}{" "}
              found
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCcw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Check #
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPDCs.map((pdc, index) => {
                  const statusConfig = getStatusConfig(pdc.status);
                  return (
                    <tr
                      key={pdc.pdc_id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900 font-mono">
                          {pdc.check_number}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {pdc.bank_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(pdc.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(pdc.due_date)}
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
                          {pdc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {pdc.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(pdc.pdc_id, "cleared")
                                }
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                title="Mark as Cleared"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(pdc.pdc_id, "bounced")
                                }
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                title="Mark as Bounced"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleView(pdc)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                            title="View Check"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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
          {filteredPDCs.map((pdc) => {
            const statusConfig = getStatusConfig(pdc.status);
            return (
              <div
                key={pdc.pdc_id}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Check Number</p>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      {pdc.check_number}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                    />
                    {pdc.status}
                  </span>
                </div>

                {/* Amount */}
                <div className="text-xl font-bold text-gray-900 mb-3">
                  {formatCurrency(pdc.amount)}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Bank</p>
                    <p className="text-gray-900 font-medium">{pdc.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Due Date</p>
                    <p className="text-gray-900 font-medium">
                      {formatDate(pdc.due_date)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {pdc.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(pdc.pdc_id, "cleared")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Clear
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(pdc.pdc_id, "bounced")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium text-sm transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Bounce
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleView(pdc)}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium text-sm transition-colors ${
                      pdc.status !== "pending" ? "flex-1" : ""
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty filtered state */}
        {filteredPDCs.length === 0 && pdcList.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No checks match your search.</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      {openModal && selectedPDC && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Check #{selectedPDC.check_number}
                  </h2>
                  <p className="text-sm text-white/80">
                    {selectedPDC.bank_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Amount Card */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">Check Amount</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(selectedPDC.amount)}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Bank</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedPDC.bank_name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(selectedPDC.due_date).toLocaleDateString(
                      "en-PH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Status</span>
                  {(() => {
                    const statusConfig = getStatusConfig(selectedPDC.status);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {selectedPDC.status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Check Image */}
              {selectedPDC.uploaded_image_url ? (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Check Image</p>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={selectedPDC.uploaded_image_url}
                      alt="Check"
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No image available for this check.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setOpenModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
