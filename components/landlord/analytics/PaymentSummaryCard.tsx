"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, AlertCircle, CheckCircle, Users } from "lucide-react";
import {
    CARD_CONTAINER_INTERACTIVE,
    SECTION_HEADER,
    GRADIENT_DOT,
    SECTION_TITLE,
    GRADIENT_TEXT,
} from "@/constant/design-constants";

/* --------------------------------------------------
   ApexCharts (lazy)
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
    landlord_id: string;
    onClick?: () => void;
}

export default function PaymentSummaryCard({ landlord_id, onClick }: Props) {
    /* ---------------- Stats ---------------- */
    const {
        data: stats = {
            total_collected: 0,
            total_pending: 0,
            total_overdue: 0,
        },
        isLoading: statsLoading,
    } = useSWR(
        `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    /* ---------------- Tenants ---------------- */
    const { data: tenants = [], isLoading: tenantsLoading } = useSWR<Tenant[]>(
        `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 120_000 }
    );

    /* ---------------- Computed ---------------- */
    const collected = Math.round(stats.total_collected || 0);
    const pending = Math.round(stats.total_pending || 0);
    const overdue = Math.round(stats.total_overdue || 0);
    const total = collected + pending + overdue;

    const monthLabel = useMemo(
        () =>
            new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            }),
        []
    );

    const series = useMemo(
        () => [collected, pending, overdue],
        [collected, pending, overdue]
    );

    const options = useMemo(
        () => ({
            chart: { type: "donut", animations: { enabled: !statsLoading } },
            labels: ["Collected", "Upcoming", "Overdue"],
            colors: COLORS,
            legend: { show: false },
            stroke: { width: 2, colors: ["#fff"] },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: "68%", // thinner ring → looks bigger
                        labels: {
                            show: true,
                            value: {
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#374151",
                                formatter: () => `₱${total.toLocaleString()}`,
                            },
                            total: {
                                show: true,
                                label: "Total",
                                fontSize: "12px",
                                color: "#6b7280",
                                formatter: () => `₱${total.toLocaleString()}`,
                            },
                        },
                    },
                },
            },
            tooltip: {
                y: {
                    formatter: (val: number) => `₱${val.toLocaleString()}`,
                },
            },
        }),
        [total, statsLoading]
    );

    return (
        <div
            onClick={onClick}
            className={`${CARD_CONTAINER_INTERACTIVE} p-4 flex flex-col`}
        >
            {/* ================= HEADER ================= */}
            <div className="mb-4">
                <div className={SECTION_HEADER}>
                    <span className={GRADIENT_DOT} />
                    <h2 className={SECTION_TITLE}>Collections and Payment</h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Payments for the month of{" "}
                    <span className={`font-semibold ${GRADIENT_TEXT}`}>
            {monthLabel}
          </span>
                </p>
            </div>

            {/* ================= STATS ================= */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat icon={<TrendingUp className="w-4 h-4" />} label="Upcoming" value={pending} color="blue" loading={statsLoading} />
                <Stat icon={<AlertCircle className="w-4 h-4" />} label="Overdue" value={overdue} color="orange" loading={statsLoading} />
                <Stat icon={<CheckCircle className="w-4 h-4" />} label="Collected" value={collected} color="emerald" loading={statsLoading} />
            </div>

            {/* ================= DONUT ================= */}
            <div className="flex justify-center my-4">
                {statsLoading ? (
                    <div className="w-[180px] h-[180px] rounded-full bg-gray-100 animate-pulse" />
                ) : (
                    <Chart
                        options={options}
                        series={total > 0 ? series : [1]}
                        type="donut"
                        width={180}
                        height={180}
                    />
                )}
            </div>

            {/* ================= TENANTS ================= */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                {tenantsLoading ? (
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                ) : tenants.length > 0 ? (
                    <>
                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                            <Users className="w-4 h-4 text-blue-600" />
                            Current Tenants ({tenants.length})
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {tenants.slice(0, 6).map((tenant) => (
                                <Link
                                    key={tenant.tenant_id}
                                    href={`/pages/landlord/list_of_tenants/${tenant.tenant_id}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border shadow hover:scale-110 transition">
                                        <Image
                                            src={
                                                tenant.profilePicture ||
                                                "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                            }
                                            alt={`${tenant.firstName} ${tenant.lastName}`}
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                            ))}

                            {tenants.length > 6 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-dashed">
                                    +{tenants.length - 6}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-gray-500 text-center">No tenants yet</p>
                )}
            </div>
        </div>
    );
}

/* --------------------------------------------------
   Stat (Compact)
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
        <div className={`p-2 rounded-lg border ${colorMap[color]} flex flex-col items-center`}>
            {icon}
            <p className="text-[11px] mt-1 text-gray-600">{label}</p>
            <p className="font-bold text-sm mt-0.5">
                {loading ? (
                    <span className="inline-block w-14 h-4 bg-gray-300 rounded animate-pulse" />
                ) : (
                    `₱${value.toLocaleString()}`
                )}
            </p>
        </div>
    );
}
