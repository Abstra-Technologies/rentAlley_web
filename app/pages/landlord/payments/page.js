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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Property Payments
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                View and oversee your tenant payment records
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tenant Payments Ledger - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                <PaymentList landlord_id={landlord_id} />
              </div>
            </div>
          </div>

          {/* Payment Review Widget - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                <PaymentReviewWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Security Deposits Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
            <PaidDepositsWidget landlord_id={landlord_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
