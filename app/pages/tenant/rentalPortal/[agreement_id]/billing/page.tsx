"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import useAuthStore from "@/zustand/authStore";
import TenantBilling from "@/components/tenant/billing/currentBilling";
import PreviousBilling from "@/components/tenant/billing/prevBillingList";
import { ReceiptPercentIcon, ClockIcon } from "@heroicons/react/24/outline";
import OverdueBilling from "@/components/tenant/billing/OverdueBilling";

function BillingContent() {
  const { user, fetchSession } = useAuthStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

    const params = useParams();
    const agreementId = params?.agreement_id as string | undefined;

  useEffect(() => {
    async function init() {
      if (!user) {
        await fetchSession();
      }
      setIsInitialLoad(false);
    }
    init();
  }, [user, fetchSession]);

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-6 md:mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Current Billing Skeleton */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 h-6 bg-gray-200 rounded animate-pulse"></span>
            </div>
          </div>

          {/* Previous Billing Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Previous Billing List Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="h-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
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

          <TenantBilling agreement_id={agreementId} user_id={user?.user_id} />
        </div>

          <div className="relative mb-8">
              <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
              >
                  <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
            <span className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 text-sm font-bold text-gray-500 uppercase tracking-wide">
                Overdue Billing
            </span>
              </div>
          </div>

          <OverdueBilling
              agreement_id={agreementId}
              user_id={user?.user_id}
          />

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
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading billing data...</p>
          </div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
