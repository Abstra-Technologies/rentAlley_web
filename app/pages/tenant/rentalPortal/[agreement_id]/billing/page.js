"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantBilling from "@/components/tenant/billing/currentBilling";
import PreviousBilling from "@/components/tenant/billing/prevBillingList";
import LoadingScreen from "@/components/loadingScreen";
import { ReceiptPercentIcon, ClockIcon } from "@heroicons/react/24/outline";

function BillingContent() {
  const { user, fetchSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  useEffect(() => {
    const init = async () => {
      if (!user) {
        await fetchSession();
      }
      setLoading(false);
    };
    init();
  }, [user, fetchSession]);

  if (loading || !user) {
    return <LoadingScreen message="Loading your billing information..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex-shrink-0">
              <ReceiptPercentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Billing Statement
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Review your detailed monthly billing
              </p>
            </div>
          </div>
        </div>

        {/* Current Billing Section */}
        <div className="mb-8">
          <TenantBilling agreement_id={agreementId} user_id={user.user_id} />
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 text-sm font-bold text-gray-500 uppercase tracking-wide">
              Previous Records
            </span>
          </div>
        </div>

        {/* Previous Billing Header */}
        <div className="mb-6 md:mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Billing History
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                View and download your previous billing statements
              </p>
            </div>
          </div>
        </div>

        {/* Previous Billing Section */}
        <PreviousBilling agreement_id={agreementId} user_id={user.user_id} />
      </div>
    </div>
  );
}

export default function TenantBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <LoadingScreen message="Loading billing data..." />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
