"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import {
  TrendingUp,
  Users,
  Wrench,
  Building2,
  BarChart3,
  PieChart,
} from "lucide-react";

const TenantOccupationChart = dynamic(
  () => import("@/components/landlord/analytics/tenantOccupation"),
  { ssr: false }
);
const PropertyUtilitiesChart = dynamic(
  () => import("@/components/landlord/analytics/propertyUtilityRates"),
  { ssr: false }
);
const MaintenanceCategoriesChart = dynamic(
  () => import("@/components/landlord/analytics/getMaintenanceCategory"),
  { ssr: false }
);
const TenantAgeGroupChart = dynamic(
  () => import("@/components/landlord/analytics/tenantAgegroup"),
  { ssr: false }
);
const AverageLeaseDurationChart = dynamic(
  () => import("@/components/landlord/analytics/AverageLeaseDurationChart"),
  { ssr: false }
);
const LeaseExpiryForecast = dynamic(
  () => import("@/components/landlord/analytics/UnitDistributionChart"),
  { ssr: false }
);
const RevenueExpenseTrendChart = dynamic(
  () => import("@/components/landlord/analytics/RevenueExpenseTrendChart"),
  { ssr: false }
);

import ActiveListingsCard from "@/components/landlord/analytics/activeListings";
import PendingListingsCard from "@/components/landlord/analytics/getPendingListings";
import ScoreCard from "@/components/landlord/analytics/scoreCards";

export default function PropertyPerformancePage() {
  const { user, admin, fetchSession } = useAuthStore();
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !admin) fetchSession();
  }, [user, admin]);

  useEffect(() => {
    if (!user?.landlord_id) return;

    setLoading(true);
    fetch(`/api/analytics/landlord/overview?landlord_id=${user.landlord_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Analytics API Error:", data.error);
          return;
        }
        setTotalTenants(data.totalTenants || 0);
        setTotalRequests(
          Array.isArray(data.maintenanceCategories)
            ? data.maintenanceCategories.reduce(
                (sum, cat) => sum + (cat.count || 0),
                0
              )
            : 0
        );
      })
      .catch((err) => console.error("Error fetching analytics overview:", err))
      .finally(() => setLoading(false));
  }, [user?.landlord_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading analytics...</p>
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
          <div className="flex items-start gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Property Performance Analytics
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Monitor key metrics and track property performance at a glance
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Key Performance Indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">Financial Trends</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-gray-600">Tenant & Property Insights</span>
            </div>
          </div>
        </div>

        {/* 🎯 SECTION 1: KPI Cards - MOST IMPORTANT (Top Priority) */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Key Performance Indicators
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Critical metrics for quick decision-making
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActiveListingsCard landlordId={user?.landlord_id} />
            <PendingListingsCard landlordId={user?.landlord_id} />
            <ScoreCard
              title="Total Active Tenants"
              value={totalTenants}
              borderColor="green"
            />
            <ScoreCard
              title="Pending Maintenance"
              value={totalRequests}
              borderColor="red"
            />
          </div>
        </section>

        {/* 📈 SECTION 2: Revenue Trend - Financial Overview (Second Priority) */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Card Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Revenue vs Expense Trend
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      Monthly financial performance overview
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 sm:p-6">
              <div className="w-full h-[300px] sm:h-[400px]">
                <RevenueExpenseTrendChart landlordId={user?.landlord_id} />
              </div>
            </div>
          </div>
        </section>

        {/* 👥 SECTION 3: Tenant Insights */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Tenant Insights
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Demographics and occupancy patterns
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <TenantOccupationChart landlordId={user?.landlord_id} />
            <TenantAgeGroupChart landlordId={user?.landlord_id} />
            <AverageLeaseDurationChart landlordId={user?.landlord_id} />
          </div>
        </section>

        {/* 🏢 SECTION 4: Property Insights */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Property Insights
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Operational metrics and maintenance tracking
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <PropertyUtilitiesChart landlordId={user?.landlord_id} />
            <MaintenanceCategoriesChart landlordId={user?.landlord_id} />
            <LeaseExpiryForecast landlordId={user?.landlord_id} />
          </div>
        </section>
      </div>
    </div>
  );
}   
