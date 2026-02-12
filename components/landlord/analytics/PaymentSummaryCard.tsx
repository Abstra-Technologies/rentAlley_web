"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, AlertCircle, CheckCircle, Users } from "lucide-react";
import {
    CARD_CONTAINER_INTERACTIVE,
    SECTION_HEADER,
    GRADIENT_DOT,
    SECTION_TITLE,
} from "@/constant/design-constants";

/* =========================
   Lazy ApexChart
========================= */
const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

/* =========================
   Fetcher
========================= */
const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

interface Props {
    landlord_id: string;
    onClick?: () => void;
}

export default function PaymentSummaryCard({
                                               landlord_id,
                                               onClick,
                                           }: Props) {
    const [selectedPropertyId, setSelectedPropertyId] =
        useState<string>("all");

    /* =========================
       PROPERTIES
    ========================= */
    const {
        data: propertyResponse,
        isLoading: propertiesLoading,
    } = useSWR(
        landlord_id
            ? `/api/landlord/${landlord_id}/properties`
            : null,
        fetcher,
        {
            revalidateOnFocus: true,
            refreshInterval: 60000,
        }
    );

    const properties = propertyResponse?.data ?? [];

    /* =========================
       STATS (REALTIME)
    ========================= */
    const statsKey = landlord_id
        ? selectedPropertyId === "all"
            ? `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}`
            : `/api/analytics/landlord/getTotalReceivablesforTheMonth?landlord_id=${landlord_id}&property_id=${selectedPropertyId}`
        : null;

    const {
        data: stats,
        isLoading: statsLoading,
        mutate: mutateStats,
    } = useSWR(statsKey, fetcher, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 30000, // 🔥 auto refresh every 30s
    });

    /* =========================
       TENANTS (REALTIME)
    ========================= */
    const tenantsKey = landlord_id
        ? selectedPropertyId === "all"
            ? `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`
            : `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}&property_id=${selectedPropertyId}`
        : null;

    const {
        data: tenants = [],
        isLoading: tenantsLoading,
        mutate: mutateTenants,
    } = useSWR(tenantsKey, fetcher, {
        revalidateOnFocus: true,
        refreshInterval: 60000,
    });

    /* =========================
       Auto refresh when property changes
    ========================= */
    useEffect(() => {
        mutateStats();
        mutateTenants();
    }, [selectedPropertyId]);

    /* =========================
       Derived values
    ========================= */
    const collected = Math.round(stats?.total_collected || 0);
    const pending = Math.round(stats?.total_pending || 0);
    const overdue = Math.round(stats?.total_overdue || 0);
    const total = collected + pending + overdue;

    const monthLabel = useMemo(
        () =>
            new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            }),
        []
    );

    const chartOptions = useMemo(
        () => ({
            chart: { type: "donut" },
            labels: ["Paid", "Upcoming", "Overdue"],
            colors: ["#10b981", "#3b82f6", "#f97316"],
            legend: { show: false },
            dataLabels: { enabled: false },
            stroke: { width: 2, colors: ["#fff"] },
            plotOptions: {
                pie: {
                    donut: {
                        size: "68%",
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: "Total Due",
                                formatter: () => `₱${total.toLocaleString()}`,
                            },
                        },
                    },
                },
            },
        }),
        [total]
    );

    const series = useMemo(
        () => (total > 0 ? [collected, pending, overdue] : [1]),
        [collected, pending, overdue, total]
    );

    /* =========================
       RENDER
    ========================= */
    return (
        <div
            onClick={onClick}
            className={`${CARD_CONTAINER_INTERACTIVE} p-4 flex flex-col`}
        >
            {/* HEADER */}
            <div className="mb-4">
                <div className={SECTION_HEADER}>
                    <span className={GRADIENT_DOT} />
                    <h2 className={SECTION_TITLE}>
                        Tenant Payments for {monthLabel}
                    </h2>
                </div>

                <div
                    className="mt-2 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
          <span className="text-xs text-gray-500 font-medium">
            Property
          </span>

                    <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        disabled={propertiesLoading}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-md bg-white"
                    >
                        <option value="all">All Properties</option>
                        {properties.map((property: any) => (
                            <option
                                key={property.property_id}
                                value={property.property_id}
                            >
                                {property.property_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Upcoming"
                    value={pending}
                    color="blue"
                    loading={statsLoading}
                />
                <Stat
                    icon={<AlertCircle className="w-4 h-4" />}
                    label="Overdue"
                    value={overdue}
                    color="orange"
                    loading={statsLoading}
                />
                <Stat
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Paid"
                    value={collected}
                    color="emerald"
                    loading={statsLoading}
                />
            </div>

            {/* DONUT */}
            <div className="flex justify-center my-4">
                {statsLoading ? (
                    <div className="w-[180px] h-[180px] rounded-full bg-gray-100 animate-pulse" />
                ) : (
                    <Chart
                        options={chartOptions}
                        series={series}
                        type="donut"
                        width={180}
                        height={180}
                    />
                )}
            </div>

            {/* TENANTS */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                {tenantsLoading ? (
                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"
                            />
                        ))}
                    </div>
                ) : tenants.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tenants.slice(0, 6).map((tenant: any) => (
                            <Link
                                key={tenant.tenant_id}
                                href={`/pages/landlord/list_of_tenants/${tenant.tenant_id}`}
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
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 text-center">
                        No tenants for this property
                    </p>
                )}
            </div>
        </div>
    );
}

/* =========================
   Stat Component
========================= */
function Stat({
                  icon,
                  label,
                  value,
                  color,
                  loading,
              }: any) {
    const colorMap: any = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    return (
        <div
            className={`p-2 rounded-lg border ${colorMap[color]} flex flex-col items-center`}
        >
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
