"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

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

export const PaidDepositsWidget: React.FC<Props> = ({ landlord_id }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!landlord_id) return;

    setLoading(true);
    setError(null);

    const fetchTenants = async () => {
      try {
        const res = await axios.get(
          `/api/landlord/secAdv/${landlord_id}/payments-secAdv`
        );
        setTenants(res.data.tenants || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch tenants.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [landlord_id]);

  if (!landlord_id) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">Landlord not loaded</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading tenants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-8 h-8 text-red-500"
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
        <p className="text-red-600 font-medium mb-1">Error Loading Data</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!tenants.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          No Deposits Yet
        </h3>
        <p className="text-sm text-gray-600">
          Tenant deposits will appear here once paid.
        </p>
      </div>
    );
  }

    return (
        <div
            className="
      grid
      gap-4

      /* Mobile: 1 column card style */
      grid-cols-1

      /* Large: turn into a vertical list using full-width rows */
      lg:grid-cols-1
    "
        >
            {tenants.map((tenant) => (
                <div
                    key={tenant.user_id}
                    className="
          bg-gradient-to-br from-gray-50 to-white
          border border-gray-200
          rounded-lg p-4
          transition-all

          /* MOBILE → stacked card */
          flex flex-col gap-4

          /* LARGE SCREEN → list row layout */
          lg:flex-row lg:items-center lg:justify-between
          lg:py-3
        "
                >
                    {/* LEFT SIDE → Tenant Badge + Info */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-blue-600">
              {tenant.firstName?.charAt(0)}
                {tenant.lastName?.charAt(0)}
            </span>
                        </div>

                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {tenant.firstName} {tenant.lastName}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">{tenant.property_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                                Unit: {tenant.unit_name}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE → Payment Status */}
                    <div
                        className="
            grid gap-2
            w-full

            /* Mobile cards: 1 column */
            grid-cols-1

            /* Large list style: 2 equal columns */
            lg:grid-cols-2 lg:w-[320px]
          "
                    >
                        {/* Security Deposit */}
                        <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="text-xs font-medium text-gray-700">Security Deposit</span>
                            {tenant.secDepositPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                ✓ Paid
              </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                ⏳ Pending
              </span>
                            )}
                        </div>

                        {/* Advance Payment */}
                        <div className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                            <span className="text-xs font-medium text-gray-700">Advance Payment</span>
                            {tenant.advPaymentPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                ✓ Paid
              </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                ⏳ Pending
              </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );


};
