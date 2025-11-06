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
    <TenantLayout agreement_id={agreementId}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 -m-4 md:-m-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm bg-white hover:bg-gray-50 rounded-xl transition-all border-2 border-gray-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>

          {/* Content */}
          {agreementId ? (
            <TenantLeasePayments agreement_id={agreementId} />
          ) : (
            <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <p className="text-amber-700 font-medium">
                No agreement ID provided. Please try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </TenantLayout>
  );
}

function PaymentsFallback() {
  return <LoadingScreen message="Loading payment history..." />;
}

export default function TenantPayments() {
  return (
    <Suspense fallback={<PaymentsFallback />}>
      <TenantPaymentsContent />
    </Suspense>
  );
}
