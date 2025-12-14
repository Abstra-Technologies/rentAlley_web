"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";
import {
  FileText,
  CheckCircle,
  XCircle,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";

interface PDC {
  pdc_id: number;
  lease_id: number;
  check_number: string;
  bank_name: string;
  amount: number;
  due_date: string;
  status: "pending" | "cleared" | "bounced" | "replaced";
  uploaded_image_url?: string;
  notes?: string;
  tenant_name?: string;
  unit_name?: string;
}

interface Props {
  propertyId: string;
}

export default function PDCManagementPerProperty({ propertyId }: Props) {
  const [pdcList, setPdcList] = useState<PDC[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });


  // ✅ Fetch ALL PDCs for the property
  const fetchPDCs = async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const response = await axios.get("/api/landlord/pdc/getByProperty", {
        params: {
          property_id: propertyId,
          status: filterStatus !== "all" ? filterStatus : undefined,
        },
      });
      const { data } = response.data;
      setPdcList(data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load PDC records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDCs();
  }, [propertyId, filterStatus]);

  const handleStatusUpdate = async (pdcId: number, newStatus: string) => {
    try {
      await axios.put("/api/landlord/pdc/updateStatus", {
        pdc_id: pdcId,
        status: newStatus,
      });
      Swal.fire("Updated", `PDC marked as ${newStatus}.`, "success");
      fetchPDCs();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update PDC status.", "error");
    }
  };

  // ✅ Slice data locally for pagination
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return pdcList.slice(startIndex, endIndex);
  }, [pdcList, pagination]);

  const totalPages = Math.ceil(pdcList.length / pagination.limit);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "cleared":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "bounced":
        return "bg-red-50 text-red-700 border-red-200";
      case "replaced":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Post-Dated Checks
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {["all", "pending", "cleared", "bounced", "replaced"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all ${
                    filterStatus === status
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block md:hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-900 font-semibold text-base mb-1">
              No PDC Records
            </p>
            <p className="text-gray-500 text-sm">
              No post-dated checks found for this property.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {paginatedData.map((pdc) => (
              <div
                key={pdc.pdc_id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                      Check #{pdc.check_number}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {pdc.bank_name || "—"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                      pdc.status
                    )}`}
                  >
                    {pdc.status}
                  </span>
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-gray-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant:</span>
                    <span className="font-medium text-gray-900">
                      {pdc.tenant_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium text-gray-900">
                      {pdc.unit_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(pdc.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(pdc.due_date)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {pdc.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(pdc.pdc_id, "cleared")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Clear
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(pdc.pdc_id, "bounced")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Bounce
                      </button>
                    </>
                  )}
                  {pdc.status === "bounced" && (
                    <button
                      onClick={() => handleStatusUpdate(pdc.pdc_id, "replaced")}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Mark Replaced
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Check #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Bank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-900 font-semibold text-lg mb-1">
                      No PDC Records
                    </p>
                    <p className="text-gray-500 text-sm">
                      No post-dated checks found for this property.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((pdc) => (
                <tr
                  key={pdc.pdc_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 text-sm">
                    {pdc.check_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pdc.bank_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pdc.tenant_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pdc.unit_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600">
                    {formatCurrency(pdc.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(pdc.due_date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                        pdc.status
                      )}`}
                    >
                      {pdc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {pdc.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(pdc.pdc_id, "cleared")
                            }
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Mark as Cleared"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(pdc.pdc_id, "bounced")
                            }
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Mark as Bounced"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {pdc.status === "bounced" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(pdc.pdc_id, "replaced")
                          }
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Mark as Replaced"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination (Frontend Controlled) */}
      {!loading && pdcList.length > pagination.limit && (
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          totalItems={pdcList.length}
          itemsPerPage={pagination.limit}
        />
      )}
    </div>
  );
}
