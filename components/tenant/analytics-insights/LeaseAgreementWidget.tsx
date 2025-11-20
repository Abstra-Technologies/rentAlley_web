"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLease() {
      try {
        const res = await axios.get<{ lease: LeaseAgreement[] }>(
          `/api/tenant/dashboard/getLeaseWidget?agreement_id=${agreement_id}`
        );
        setLease(res.data.lease[0]);
      } catch (err: any) {
        console.error("Error fetching lease:", err);
        setError(err.response?.data?.message || "Failed to load lease data.");
      } finally {
        setLoading(false);
      }
    }
    if (agreement_id) fetchLease();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="text-center py-6">
        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No lease data</p>
      </div>
    );
  }

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

  const isExpiringSoon = remainingDays <= 30 && remainingDays > 0;
  const isExpired = remainingDays === 0;

  const statusColor = isExpired
    ? "text-red-600"
    : isExpiringSoon
    ? "text-amber-600"
    : "text-emerald-600";

  const statusBg = isExpired
    ? "bg-red-50 border-red-200"
    : isExpiringSoon
    ? "bg-amber-50 border-amber-200"
    : "bg-emerald-50 border-emerald-200";

  const barColor = isExpired
    ? "bg-red-500"
    : isExpiringSoon
    ? "bg-amber-500"
    : "bg-blue-500";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Lease Duration</h3>
            <p className="text-xs text-gray-600">Contract timeline</p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-semibold border ${
            isExpired
              ? "bg-red-100 text-red-700 border-red-200"
              : isExpiringSoon
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"
          }`}
        >
          {isExpired ? "Expired" : isExpiringSoon ? "Expiring" : "Active"}
        </span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Start
          </p>
          <p className="text-sm font-bold text-gray-900">
            {start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${statusBg}`}>
          <p
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${statusColor}`}
          >
            End
          </p>
          <p className="text-sm font-bold text-gray-900">
            {end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Remaining Time Card */}
      <div className={`rounded-lg border p-4 ${statusBg}`}>
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isExpired
                ? "bg-red-100"
                : isExpiringSoon
                ? "bg-amber-100"
                : "bg-emerald-100"
            }`}
          >
            <ClockIcon className={`w-5 h-5 ${statusColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Time Remaining
            </p>
            <p className={`text-2xl font-bold ${statusColor} leading-tight`}>
              {Math.ceil(remainingDays)}
              <span className="text-sm ml-1 font-normal text-gray-600">
                days
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">
            {Math.floor(elapsedDays)} days passed
          </span>
          <span className={`font-semibold ${statusColor}`}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Status Alert */}
      {isExpired && (
        <div className="flex items-start gap-2 p-3 border border-red-200 bg-red-50 rounded-lg">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Lease Expired</p>
            <p className="text-xs text-red-700">Contact landlord for renewal</p>
          </div>
        </div>
      )}

      {!isExpired && isExpiringSoon && (
        <div className="flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg">
          <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Expiring Soon
            </p>
            <p className="text-xs text-amber-700">Consider renewal options</p>
          </div>
        </div>
      )}

      {!isExpired && !isExpiringSoon && (
        <div className="flex items-start gap-2 p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Active</p>
            <p className="text-xs text-emerald-700">Lease in good standing</p>
          </div>
        </div>
      )}
    </div>
  );
}
