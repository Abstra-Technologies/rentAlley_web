import { useEffect, useState } from "react";
import axios from "axios";

interface LeaseAgreement {
  agreement_id: number;
  start_date: string;
  end_date: string;
  duration: number;
  status: "active" | "inactive" | string;
}

interface LeaseDurationTrackerProps {
  agreement_id: number;
}

export default function LeaseDurationTracker({
  agreement_id,
}: LeaseDurationTrackerProps) {
  const [lease, setLease] = useState<LeaseAgreement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLease() {
      try {
        const response = await axios.get<{ lease: LeaseAgreement[] }>(
          `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
        );
        setLease(response.data.lease[0]);
      } catch (err: any) {
        console.error("Error fetching lease:", err);
        setError(
          err.response?.data?.message || "Failed to fetch lease agreement."
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchLease();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
        <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!lease)
    return <p className="text-gray-500 text-sm">No active lease found.</p>;

  const start = new Date(lease.start_date);
  const end = new Date(lease.end_date);
  const today = new Date();

  const totalDays = Math.max(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    1
  );
  const elapsedDays = Math.min(
    Math.max((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0),
    totalDays
  );
  const remainingDays = Math.max(totalDays - elapsedDays, 0);
  const progressPercent = (elapsedDays / totalDays) * 100;

  const isExpiringSoon = remainingDays <= 30;
  const isExpired = remainingDays === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile optimized */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">📅</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Lease Duration
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-9 sm:ml-10">Contract timeline</p>
      </div>

      {/* Timeline Info - Touch friendly spacing */}
      <div className="mb-4 space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            Start Date
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gray-900">
            {start.toLocaleDateString()}
          </span>
        </div>
        <div className="h-px bg-gray-200"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            End Date
          </span>
          <span
            className={`text-xs sm:text-sm font-semibold ${
              isExpired
                ? "text-red-600"
                : isExpiringSoon
                ? "text-orange-600"
                : "text-gray-900"
            }`}
          >
            {end.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress Bar - Larger for touch */}
      <div className="space-y-2 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isExpired
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : isExpiringSoon
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-gradient-to-r from-blue-500 to-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 px-1">
          <span>{Math.floor(elapsedDays)} days used</span>
          <span
            className={`font-semibold ${
              isExpired
                ? "text-red-600"
                : isExpiringSoon
                ? "text-orange-600"
                : "text-blue-600"
            }`}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      {/* Remaining Days - Large and prominent */}
      <div className="mb-4 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl">
        <p className="text-xs text-gray-600 mb-2 sm:mb-3">Time Remaining</p>
        <p className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text leading-tight">
          {Math.ceil(remainingDays)}
          <span className="text-lg sm:text-xl text-gray-500"> days</span>
        </p>
      </div>

      {/* Status Warnings */}
      {isExpired && (
        <div className="mt-auto pt-3 border-t border-gray-200">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-red-700">
              Lease Expired
            </span>
          </div>
        </div>
      )}

      {isExpiringSoon && !isExpired && (
        <div className="mt-auto pt-3 border-t border-gray-200">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <svg
              className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-orange-700">
              Renewal Coming Soon
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
