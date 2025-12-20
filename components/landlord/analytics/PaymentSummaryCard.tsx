"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, AlertCircle, CheckCircle, Users } from "lucide-react";

/* --------------------------------------------------
   ApexCharts - Lazy loaded with skeleton
-------------------------------------------------- */
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="w-[180px] h-[180px] rounded-full bg-gray-100 animate-pulse" />
  ),
});

/* --------------------------------------------------
   Fetcher
-------------------------------------------------- */
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

/* --------------------------------------------------
   Colors
-------------------------------------------------- */
const COLORS = ["#10b981", "#3b82f6", "#f97316"];

type Tenant = {
  tenant_id: number;
  profilePicture: string | null;
  firstName: string;
  lastName: string;
};

interface Props {
  landlord_id: string; // Now required string
  onClick?: () => void; // Optional click handler (e.g. for navigation on mobile)
}

export default function PaymentSummaryCard({ landlord_id, onClick }: Props) {
  /* ---------------- Primary Fast Data ---------------- */
  const {
    data: stats = { total_collected: 0, total_pending: 0, total_overdue: 0 },
    isLoading: statsLoading,
  } = useSWR(
    `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      fallbackData: { total_collected: 0, total_pending: 0, total_overdue: 0 },
    }
  );

  /* ---------------- Secondary Tenants Data ---------------- */
  const { data: tenants = [], isLoading: tenantsLoading } = useSWR<Tenant[]>(
    `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
    }
  );

  /* ---------------- Computed Values ---------------- */
  const collected = Math.round(Number(stats.total_collected || 0));
  const pending = Math.round(Number(stats.total_pending || 0));
  const overdue = Math.round(Number(stats.total_overdue || 0));
  const total = Math.round(collected + pending + overdue);

  const currentMonth = useMemo(
    () => new Date().toLocaleString("en-US", { month: "long" }),
    []
  );

  /* ---------------- ApexCharts Config (Memoized) ---------------- */
  const series = useMemo(
    () => [collected, pending, overdue],
    [collected, pending, overdue]
  );

  const options = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        animations: {
          enabled: !statsLoading,
        },
      },
      labels: ["Collected", "Upcoming", "Overdue"],
      colors: COLORS,
      legend: { show: false },
      stroke: { width: 3, colors: ["#fff"] },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: { show: false },
              value: {
                show: true,
                fontSize: "16px",
                fontWeight: 700,
                color: "#374151",
                formatter: () => `₱${Math.round(total).toLocaleString()}`,
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: "12px",
                color: "#6b7280",
              },
            },
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `₱${Math.round(val).toLocaleString()}`,
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: { chart: { width: 160, height: 160 } },
        },
      ],
    }),
    [total, statsLoading]
  );

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 min-h-[420px] flex flex-col cursor-pointer select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h2 className="font-semibold text-gray-900">Payment Summary</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {currentMonth}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat
          icon={<TrendingUp className="w-5 h-5" />}
          label="Upcoming"
          value={pending}
          color="blue"
          loading={statsLoading}
        />
        <Stat
          icon={<AlertCircle className="w-5 h-5" />}
          label="Overdue"
          value={overdue}
          color="orange"
          loading={statsLoading}
        />
        <Stat
          icon={<CheckCircle className="w-5 h-5" />}
          label="Collected"
          value={collected}
          color="emerald"
          loading={statsLoading}
        />
      </div>

      {/* Donut Chart */}
      <div className="flex justify-center my-6">
        {statsLoading ? (
          <div className="w-[180px] h-[180px] rounded-full bg-gray-100 animate-pulse" />
        ) : total > 0 ? (
          <Chart
            options={options}
            series={series}
            type="donut"
            width={180}
            height={180}
          />
        ) : (
          <div className="w-[180px] h-[180px] rounded-full border-8 border-gray-200 flex items-center justify-center">
            <span className="text-sm text-gray-400">No payments yet</span>
          </div>
        )}
      </div>

      {/* Tenants Section */}
      <div className="mt-auto pt-5 border-t">
        {tenantsLoading ? (
          <>
            <div className="h-4 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
            <div className="flex gap-2 flex-wrap">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"
                />
              ))}
            </div>
          </>
        ) : Array.isArray(tenants) && tenants.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-blue-600" />
              Current Tenants ({tenants.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {tenants.slice(0, 8).map((tenant) => (
                <Link
                  key={tenant.tenant_id}
                  href={`/pages/landlord/list_of_tenants/${tenant.tenant_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow hover:shadow-md hover:scale-110 transition-all">
                    <Image
                      src={
                        tenant.profilePicture ||
                        "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                      }
                      alt={`${tenant.firstName} ${tenant.lastName}`}
                      width={40}
                      height={40}
                      className="object-cover"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+HBdgAJAUPB9e9l5wAAAABJRU5ErkJggg=="
                    />
                  </div>
                </Link>
              ))}
              {tenants.length > 8 && (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-dashed">
                  +{tenants.length - 8}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center">No tenants yet</p>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------
   Stat Component
-------------------------------------------------- */
function Stat({
  icon,
  label,
  value,
  color,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "orange" | "emerald";
  loading?: boolean;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div
      className={`p-4 rounded-xl border ${
        colorMap[color]
      } flex flex-col items-center ${loading ? "opacity-70" : ""}`}
    >
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="font-bold text-lg mt-1">
        {loading ? (
          <span className="inline-block w-20 h-6 bg-gray-300 rounded animate-pulse" />
        ) : (
          `₱${value.toLocaleString()}`
        )}
      </p>
    </div>
  );
}
