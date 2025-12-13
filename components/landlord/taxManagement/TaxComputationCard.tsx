"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FileText,
  Calculator,
  Download,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";

interface Props {
  landlordId: string;
  taxType: string;
  filingType: string;
}

export default function TaxComputationCard({
  landlordId,
  taxType,
  filingType,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!landlordId || !taxType) return;
    fetchComputation();
  }, [landlordId, taxType, filingType]);

  const fetchComputation = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/landlord/taxProfile/compute?landlord_id=${landlordId}&tax_type=${taxType}&filing_type=${filingType}`
      );
      setData(res.data);
    } catch (error) {
      console.error("Failed to compute tax:", error);
      Swal.fire("Error", "Failed to compute tax data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm = async () => {
    try {
      setDownloading(true);
      Swal.fire({
        title: "Generating BIR Form...",
        text: "Please wait a moment.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `/api/landlord/taxForm?landlord_id=${landlordId}&type=${taxType}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `BIR_Form_${taxType.toUpperCase()}_${data?.period}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "BIR form downloaded successfully",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Download error:", err);
      Swal.fire("Error", "Failed to generate BIR form", "error");
    } finally {
      setDownloading(false);
    }
  };

  const getRecommendedForm = () => {
    if (taxType === "vat") {
      return filingType === "quarterly"
        ? "BIR Form 2550Q (Quarterly VAT)"
        : "BIR Form 2550M (Monthly VAT)";
    }
    if (taxType === "percentage") {
      return "BIR Form 2551Q (Quarterly Percentage Tax)";
    }
    return "N/A (Non-VAT)";
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2 sm:p-2.5 rounded-lg flex-shrink-0">
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">
            Tax Computation Summary
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">
            Computed automatically based on your billing and payment records
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 sm:space-y-4 animate-pulse">
          {/* Period Card Skeleton */}
          <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-300 rounded w-40 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Metrics Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
              <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
              <div className="h-3 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
          </div>

          {/* Breakdown Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="h-4 bg-gray-200 rounded w-40 mb-3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="h-12 bg-gray-200 rounded-lg w-full sm:w-64"></div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Period Info Card */}
          <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs text-gray-600 font-medium uppercase">
                    {data?.filing_type} Filing Period
                  </p>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 mb-1">
                  {data?.period}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {data?.start_period} — {data?.end_period}
                </p>
              </div>
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] sm:text-xs font-semibold uppercase flex-shrink-0">
                {data?.tax_type}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gross Income */}
            <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium">
                  Gross Receipts
                </p>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">
                {formatCurrency(data?.gross_income || 0)}
              </p>
            </div>

            {/* Tax Due */}
            <div className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium">
                  {taxType === "vat"
                    ? "Output VAT (12%)"
                    : taxType === "percentage"
                    ? "Percentage Tax (3%)"
                    : "Non-VAT (0%)"}
                </p>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700">
                {formatCurrency(data?.tax_due || 0)}
              </p>
            </div>
          </div>

          {/* Computation Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Computation Breakdown
            </h3>

            <div className="space-y-0 divide-y divide-gray-100">
              <div className="flex justify-between py-2 sm:py-2.5">
                <span className="text-xs sm:text-sm text-gray-700">
                  Gross Receipts
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  {formatCurrency(data?.gross_income || 0)}
                </span>
              </div>

              {taxType === "vat" && (
                <>
                  <div className="flex justify-between py-2 sm:py-2.5">
                    <span className="text-xs sm:text-sm text-gray-700">
                      Output VAT (12%)
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatCurrency(data?.tax_due || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 sm:py-2.5">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Creditable VAT Withheld
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 sm:py-2.5 bg-emerald-50 -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-lg">
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      Net VAT Payable
                    </span>
                    <span className="text-sm sm:text-base font-bold text-emerald-700">
                      {formatCurrency(data?.tax_due || 0)}
                    </span>
                  </div>
                </>
              )}

              {taxType === "percentage" && (
                <div className="flex justify-between py-2 sm:py-2.5 bg-emerald-50 -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-lg">
                  <span className="text-xs sm:text-sm font-bold text-gray-800">
                    Tax Payable (3%)
                  </span>
                  <span className="text-sm sm:text-base font-bold text-emerald-700">
                    {formatCurrency(data?.tax_due || 0)}
                  </span>
                </div>
              )}

              {taxType === "non-vat" && (
                <div className="flex justify-between py-2 sm:py-2.5 text-gray-500 italic">
                  <span className="text-xs sm:text-sm">
                    Non-VAT registered – No tax due
                  </span>
                  <span className="text-xs sm:text-sm">₱0.00</span>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Form Info */}
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs text-blue-800 font-medium mb-1">
                  Recommended BIR Form
                </p>
                <p className="text-xs sm:text-sm text-blue-700">
                  <span className="font-semibold">{getRecommendedForm()}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                  Filing Type:{" "}
                  <span className="font-medium capitalize">
                    {data?.filing_type}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Download Form Button */}
          {taxType !== "non-vat" && (
            <div className="pt-2">
              <button
                onClick={handleDownloadForm}
                disabled={downloading}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-lg font-semibold text-sm sm:text-base shadow-md transition-all ${
                  downloading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Generate Pre-Filled Form</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
