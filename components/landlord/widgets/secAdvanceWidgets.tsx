"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Tenant {
  user_id: string;
  firstName: string;
  lastName: string;
  property_name: string;
  unit_name: string;
  secDepositPaid: boolean;
  advPaymentPaid: boolean;
}

interface Props {
  landlord_id?: number;
}

const MAX_ITEMS = 5;

export const PaidDepositsWidget: React.FC<Props> = ({ landlord_id }) => {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchTenants = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(
          `/api/landlord/secAdv/${landlord_id}/payments-secAdv`
        );
        setTenants(res.data?.tenants || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tenants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [landlord_id]);

  /* =======================
       EMPTY / ERROR STATES
    ======================= */

  if (!landlord_id) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600">Landlord not loaded</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 bg-white border border-gray-200 rounded-lg p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            {/* LEFT → Tenant Info Skeleton */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>

            {/* RIGHT → Payment Status Skeleton */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:w-[320px]">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600 mb-1">
          Error Loading Data
        </p>
        <p className="text-xs text-gray-600">{error}</p>
      </div>
    );
  }

  if (!tenants.length) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          No Deposits Yet
        </h3>
        <p className="text-xs text-gray-600">
          Tenant deposits will appear here once paid.
        </p>
      </div>
    );
  }

  /* =======================
       MAIN RENDER
    ======================= */

  const visibleTenants = tenants.slice(0, MAX_ITEMS);

  return (
    <div className="flex flex-col h-full">
      {/* ✅ Scrollable container with max-height */}
      <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {visibleTenants.map((tenant) => (
          <div
            key={tenant.user_id}
            className="flex flex-col gap-4 bg-white border border-gray-200 rounded-lg p-4 lg:flex-row lg:items-center lg:justify-between hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {/* LEFT → Tenant Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                {tenant.firstName?.[0]}
                {tenant.lastName?.[0]}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {tenant.firstName} {tenant.lastName}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {tenant.property_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Unit: {tenant.unit_name}
                </p>
              </div>
            </div>

            {/* RIGHT → Payment Status */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:w-[320px]">
              {/* Security Deposit */}
              <StatusBadge
                label="Security Deposit"
                paid={tenant.secDepositPaid}
              />

              {/* Advance Payment */}
              <StatusBadge
                label="Advance Payment"
                paid={tenant.advPaymentPaid}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ✅ View All Button */}
      {tenants.length > MAX_ITEMS && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => router.push("/pages/landlord/payments/deposits")}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 rounded-lg transition-all group"
          >
            <span>View All {tenants.length} Tenants</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

/* =======================
   STATUS BADGE COMPONENT
======================= */

function StatusBadge({ label, paid }: { label: string; paid: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
      <span className="text-xs font-medium text-gray-700">{label}</span>

      {paid ? (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
          ✓ Paid
        </span>
      ) : (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-200 text-gray-600">
          ⏳ Pending
        </span>
      )}
    </div>
  );
}
