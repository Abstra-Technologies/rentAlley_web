"use client";

import { Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import MaintenanceRequestList from "@/components/tenant/currentRent/currentMaintainance/maintenance";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function TenantMaintenanceContent() {
  const { user } = useAuthStore();
    const params = useParams();
    const agreementId = params?.agreement_id;

  console.log('maintenance agreement id: ', agreementId);

  return (
    <MaintenanceRequestList
      agreement_id={agreementId}
      user_id={user?.user_id}
    />
  );
}

function MaintenanceFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="h-full px-4 pt-20 pb-24 md:px-6 md:pt-6 md:pb-6 lg:px-8">
        <div className="mb-6 md:mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="h-7 bg-gray-200 rounded w-56 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <div className="h-11 w-full sm:w-40 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-11 w-full sm:w-40 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 md:p-4 mb-6 md:mb-4">
          <div className="flex items-center gap-2 mb-4 md:mb-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-11 w-32 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 md:space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-4 lg:p-5"
            >
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
                <div className="relative w-full lg:w-64 h-48 flex-shrink-0 bg-gray-200 rounded-xl animate-pulse" />

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-9 w-28 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-3 border-t border-gray-100">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j}>
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TenantMaintenance() {
  return (
    <Suspense fallback={<MaintenanceFallback />}>
      <TenantMaintenanceContent />
    </Suspense>
  );
}
