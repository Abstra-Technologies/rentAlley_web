"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import TenantLeasePayments from "@/components/tenant/currentRent/currentLeasePaymentHistory";
import LoadingScreen from "@/components/loadingScreen";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import TenantLayout from "@/components/navigation/sidebar-tenant";

function TenantPaymentsContent() {
  const { user, fetchSession, loading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <TenantLayout agreement_id={agreementId}>

      <div className="flex-1 md:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>

          {/* Content */}
          {agreementId ? (
              <TenantLeasePayments agreement_id={agreementId} />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <p className="text-amber-700 font-medium">
                No agreement ID provided. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>
        </TenantLayout>
    </div>
  );
}

function PaymentsFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
      <LoadingScreen message="Loading payment history..." />
    </div>
  );
}

export default function TenantPayments() {
  return (
    <Suspense fallback={<PaymentsFallback />}>
      <TenantPaymentsContent />
    </Suspense>
  );
}
