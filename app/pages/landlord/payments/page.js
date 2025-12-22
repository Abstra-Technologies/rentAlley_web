"use client";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import PaymentReviewWidget from "@/components/landlord/widgets/PaymentReviewWidget";
import { PaidDepositsWidget } from "@/components/landlord/widgets/secAdvanceWidgets";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PaymentProcessAccordion from "../../../../components/landlord/PaymentProcessAccordion";

export default function PaymentsPage() {
  const { user, admin, loading, fetchSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user]);

  const landlord_id = user?.landlord_id;

  // ============================================
  // SIMPLE PAGE SKELETON (Just Structure)
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg animate-pulse" />
            <div className="lg:col-span-1 h-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse mb-6" />
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 text-sm">
              View and oversee your tenant payment records
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tenant Payments Ledger - Widget handles its own loading */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Tenant Payments Ledger
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Recent payment transactions
                    </p>
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
              <div className="p-4 sm:p-6">
                {/* Widget handles its own loading state */}
                <PaymentList landlord_id={landlord_id} />
              </div>
            </div>
          </div>

          {/* Payment Review Widget - Widget handles its own loading */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Pending Reviews
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Awaiting approval
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {/* Widget handles its own loading state */}
                <PaymentReviewWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Security Deposits Section - Widget handles its own loading */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Security Deposits & Advance Payments
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Track tenant deposits and advance rent
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {/* Widget handles its own loading state */}
            <PaidDepositsWidget landlord_id={landlord_id} />
          </div>
        </div>

        {/* Payment Process FAQ */}
        <PaymentProcessAccordion />
      </div>
    </div>
  );
}
