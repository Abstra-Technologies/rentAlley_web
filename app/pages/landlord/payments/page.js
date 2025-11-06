"use client";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import PaymentReviewWidget from "@/components/landlord/widgets/PaymentReviewWidget";
import { PaidDepositsWidget } from "@/components/landlord/widgets/secAdvanceWidgets";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const { user, admin, loading, fetchSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user]);

  const landlord_id = user?.landlord_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: pt-20 for top navbar + pb-24 for bottom nav | Desktop: normal padding */}
      <div className="px-4 pt-20 pb-24 sm:px-6 lg:px-8 md:pt-8 md:pb-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Property Payments
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Track tenant payments, deposits, and pending reviews
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Payment Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">Pending Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-gray-600">Deposits & Advances</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tenant Payments Ledger - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Card Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Tenant Payments Ledger
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Recent payment transactions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        "/pages/landlord/analytics/detailed/paymentLogs"
                      )
                    }
                    className="text-sm font-medium text-blue-600 hover:text-emerald-600 transition-colors"
                  >
                    View All →
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                <PaymentList landlord_id={landlord_id} />
              </div>
            </div>
          </div>

          {/* Payment Review Widget - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Card Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Pending Reviews
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Awaiting approval
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                <PaymentReviewWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Security Deposits Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Card Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Security Deposits & Advance Payments
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Track tenant deposits and advance rent
                </p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-6">
            <PaidDepositsWidget landlord_id={landlord_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
