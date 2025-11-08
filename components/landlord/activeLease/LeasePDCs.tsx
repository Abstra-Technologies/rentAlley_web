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

  useEffect(() => {
    if (lease?.pdcs) setPdcList(lease.pdcs);
  }, [lease]);

  const handleRefresh = async () => {
    if (!lease?.lease_id) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/leaseAgreement/getDetailedLeaseInfo/${lease.lease_id}`
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
          pdc.pdc_id === pdc_id ? { ...pdc, status: newStatus as any } : pdc
        )
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

  if (!pdcList || pdcList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">
            No Post-Dated Checks Found
          </h3>
          <p className="text-sm text-gray-600">
            There are currently no PDC records for this lease agreement.
          </p>
        </div>
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
            <p className="text-sm text-gray-600">
              Manage and track all issued checks related to this lease.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCcw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdcList.map((pdc) => (
                  <tr
                    key={pdc.pdc_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pdc.check_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {pdc.bank_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        ₱
                        {Number(pdc.amount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(pdc.due_date).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          pdc.status === "cleared"
                            ? "bg-green-100 text-green-800"
                            : pdc.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : pdc.status === "bounced"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {pdc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {pdc.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(pdc.pdc_id, "cleared")
                              }
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                              title="Mark as Cleared"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(pdc.pdc_id, "bounced")
                              }
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              title="Mark as Bounced"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleView(pdc)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="View Check"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {pdcList.map((pdc) => (
            <div
              key={pdc.pdc_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Check Number</p>
                  <p className="text-sm font-bold text-gray-900">
                    {pdc.check_number}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    pdc.status === "cleared"
                      ? "bg-green-100 text-green-800"
                      : pdc.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : pdc.status === "bounced"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {pdc.status}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Bank:</span>
                  <span className="text-gray-900 font-medium">
                    {pdc.bank_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="text-base font-bold text-gray-900">
                    ₱
                    {Number(pdc.amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(pdc.due_date).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {pdc.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(pdc.pdc_id, "cleared")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium text-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Clear
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(pdc.pdc_id, "bounced")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Bounce
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleView(pdc)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      {openModal && selectedPDC && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Check #{selectedPDC.check_number}
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPDC.bank_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₱
                    {Number(selectedPDC.amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedPDC.due_date).toLocaleDateString(
                      "en-PH",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      selectedPDC.status === "cleared"
                        ? "bg-green-100 text-green-800"
                        : selectedPDC.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : selectedPDC.status === "bounced"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedPDC.status}
                  </span>
                </div>

                {selectedPDC.uploaded_image_url ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Check Image</p>
                    <img
                      src={selectedPDC.uploaded_image_url}
                      alt="Check"
                      className="w-full rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No image available for this check.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
