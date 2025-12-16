"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import {
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Users,
} from "lucide-react";

/* ---------------- ApexCharts (CLIENT ONLY) ---------------- */
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ---------------- Fetcher ---------------- */
const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

/* ---------------- Color System (SINGLE SOURCE OF TRUTH) ---------------- */
const PAYMENT_COLORS = {
    collected: "#10b981",
    pending: "#3b82f6",
    overdue: "#f97316",
};

/* ---------------- Types ---------------- */
type Tenant = {
    tenant_id: number;
    profilePicture: string | null;
    firstName: string;
    lastName: string;
};

export default function PaymentSummaryCard({
                                               landlord_id,
                                               onClick,
                                           }: {
    landlord_id?: number;
    onClick?: () => void;
}) {
    /* ---------------- SWR ---------------- */
    const { data: stats, isLoading } = useSWR(
        landlord_id
            ? `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`
            : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const { data: tenants } = useSWR<Tenant[]>(
        landlord_id
            ? `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 120_000,
        }
    );

    /* ---------------- Derived ---------------- */
    const pending = Number(stats?.total_pending || 0);
    const overdue = Number(stats?.total_overdue || 0);
    const collected = Number(stats?.total_collected || 0);
    const total = pending + overdue + collected;

    /* ---------------- Apex Donut Config ---------------- */
    const series = useMemo(
        () => [collected, pending, overdue],
        [collected, pending, overdue]
    );

    const options = useMemo(
        () => ({
            chart: {
                type: "donut",
                animations: {
                    enabled: total > 0,
                    easing: "easeinout",
                    speed: 600,
                },
            },
            labels: ["Collected", "Upcoming", "Overdue"],
            colors: [
                PAYMENT_COLORS.collected,
                PAYMENT_COLORS.pending,
                PAYMENT_COLORS.overdue,
            ],
            legend: {
                show: false,
            },
            stroke: {
                width: 2,
                colors: ["#ffffff"],
            },
            dataLabels: {
                enabled: false,
            },
            tooltip: {
                y: {
                    formatter: (val: number) =>
                        `₱${val.toLocaleString()}`,
                },
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "65%",
                    },
                },
            },
        }),
        [total]
    );

    /* ---------------- Skeleton ---------------- */
    if (isLoading) {
        return (
            <div className="bg-white border rounded-lg p-6 min-h-[420px] animate-pulse">
                <div className="h-5 w-1/3 bg-gray-200 rounded mb-6" />
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="h-20 bg-gray-100 rounded" />
                    <div className="h-20 bg-gray-100 rounded" />
                    <div className="h-20 bg-gray-100 rounded" />
                </div>
                <div className="h-[120px] w-[120px] bg-gray-100 rounded-full mx-auto" />
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className="bg-white border rounded-lg p-6 hover:shadow-md transition min-h-[420px] flex flex-col cursor-pointer"
        >
            {/* Header */}
            <div className="flex justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">
                    Payment Summary
                </h2>
                <span className="text-xs text-gray-500">
          {new Date().toLocaleString("en-US", { month: "long" })}
        </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Stat
                    icon={<TrendingUp />}
                    label="Upcoming"
                    value={pending}
                    color="blue"
                />
                <Stat
                    icon={<AlertCircle />}
                    label="Overdue"
                    value={overdue}
                    color="orange"
                />
                <Stat
                    icon={<CheckCircle />}
                    label="Collected"
                    value={collected}
                    color="emerald"
                />
            </div>

            {/* Donut Chart */}
            <div className="flex justify-center mb-6">
                {total > 0 ? (
                    <div className="relative">
                        <Chart
                            options={options}
                            series={series}
                            type="donut"
                            width={180}
                            height={180}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold text-sm">
                                ₱{total.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-[140px] h-[140px] rounded-full border-4 border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No data</span>
                    </div>
                )}
            </div>

            {/* Tenants */}
            {Array.isArray(tenants) && tenants.length > 0 && (
                <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                        <Users className="w-4 h-4 text-blue-600" />
                        Current Tenants
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {tenants.slice(0, 8).map((t) => (
                            <Link
                                key={t.tenant_id}
                                href={`/pages/landlord/list_of_tenants/${t.tenant_id}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden border hover:scale-110 transition">
                                    <Image
                                        src={
                                            t.profilePicture ||
                                            "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                        }
                                        alt={`${t.firstName} ${t.lastName}`}
                                        width={40}
                                        height={40}
                                        loading="lazy"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------------- Stat ---------------- */
function Stat({
                  icon,
                  label,
                  value,
                  color,
              }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: "blue" | "orange" | "emerald";
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        emerald: "bg-emerald-50 text-emerald-600",
    };

    return (
        <div className={`p-3 rounded-lg border ${colors[color]} flex flex-col items-center`}>
            {icon}
            <p className="text-[10px] mt-1">{label}</p>
            <p className="font-bold text-sm">
                ₱{value.toLocaleString()}
            </p>
        </div>
    );
}
