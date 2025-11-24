"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantBilling from "@/components/tenant/billing/currentBilling";
import PreviousBilling from "@/components/tenant/billing/prevBillingList";
import LoadingScreen from "@/components/loadingScreen";

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
    <div className="space-y-8 p-4 md:p-8">
      {/* Current Billing Section */}
      <TenantBilling agreement_id={agreementId} user_id={user.user_id} />

      {/* Divider */}

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 text-sm font-bold text-gray-500 uppercase tracking-wide">
            Previous Records
          </span>
        </div>
      </div>

      {/* Previous Billing Section */}
      <div className="px-4 sm:px-6 lg:px-8">
        <PreviousBilling agreement_id={agreementId} user_id={user.user_id} />
      </div>
    </div>
  );
}

export default function TenantBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingScreen message="Loading billing data..." />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
