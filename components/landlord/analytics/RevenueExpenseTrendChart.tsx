"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* =========================
   TYPES
========================= */
type TrendData = {
    months: string[];
    revenue: number[];
    expenses: number[];
};

type Property = {
    property_id: string; // ✅ STRING
    property_name: string;
    city: string;
    province: string;
};

/* =========================
   COMPONENT
========================= */
export default function RevenueExpenseTrendChart({
                                                     landlordId,
                                                 }: {
    landlordId: string;
}) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

    const [trend, setTrend] = useState<TrendData>({
        months: [],
        revenue: [],
        expenses: [],
    });

    const [loadingProperties, setLoadingProperties] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* =========================
       FETCH PROPERTIES
    ========================= */
    useEffect(() => {
        if (!landlordId) return;

        setLoadingProperties(true);
        setError(null);

        fetch(`/api/landlord/${landlordId}/properties`)
            .then((res) => res.json())
            .then((res) => {
                const list: Property[] = res?.data ?? [];
                setProperties(list);

                // set default ONLY ONCE
                if (list.length > 0) {
                    setSelectedProperty((prev) =>
                        prev === null ? list[0].property_id : prev
                    );
                }
            })
            .catch(() => setError("Failed to load properties"))
            .finally(() => setLoadingProperties(false));
    }, [landlordId]);

    /* =========================
       FETCH ANALYTICS
    ========================= */
    useEffect(() => {
        if (!landlordId || selectedProperty === null) return;

        setLoadingChart(true);
        setError(null);

        fetch(
            `/api/analytics/landlord/revenue-expense-trend` +
            `?landlord_id=${landlordId}` +
            `&property_id=${selectedProperty}`
        )
            .then((res) => res.json())
            .then((data) => {
                setTrend({
                    months: Array.isArray(data?.months) ? data.months : [],
                    revenue: Array.isArray(data?.revenue) ? data.revenue : [],
                    expenses: Array.isArray(data?.expenses) ? data.expenses : [],
                });
            })
            .catch(() => setError("Failed to load financial trends"))
            .finally(() => setLoadingChart(false));
    }, [landlordId, selectedProperty]);

    /* =========================
       CHART CONFIG
    ========================= */
    const options: ApexCharts.ApexOptions = useMemo(
        () => ({
            chart: {
                type: "line",
                toolbar: { show: true },
                fontFamily: "inherit",
                animations: { enabled: true },
            },
            stroke: { curve: "smooth", width: 3 },
            xaxis: { categories: trend.months },
            yaxis: {
                labels: {
                    formatter: (v) => `₱${Number(v).toLocaleString()}`,
                },
            },
            colors: ["#10B981", "#EF4444"],
            dataLabels: { enabled: false },
            legend: { position: "top", horizontalAlign: "right" },
            grid: { strokeDashArray: 4 },
        }),
        [trend.months]
    );

    const series = useMemo(
        () => [
            { name: "Revenue", data: trend.revenue },
            { name: "Expenses", data: trend.expenses },
        ],
        [trend.revenue, trend.expenses]
    );

    /* =========================
       RENDER STATES
    ========================= */
    if (loadingProperties) {
        return (
            <div className="flex items-center justify-center h-[320px]">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <TrendingUp className="mx-auto mb-3 text-red-500" size={40} />
                <p className="text-gray-600">{error}</p>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No properties found for this landlord
            </div>
        );
    }

    /* =========================
       MAIN UI
    ========================= */
    return (
        <div className="space-y-4">
            {/* PROPERTY SELECT */}
            <div className="flex justify-end">
                <select
                    value={selectedProperty ?? ""}
                    onChange={(e) => setSelectedProperty(e.target.value)} // ✅ STRING
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {properties.map((p) => (
                        <option key={p.property_id} value={p.property_id}>
                            {p.property_name} ({p.city})
                        </option>
                    ))}
                </select>
            </div>

            {/* CHART */}
            {loadingChart ? (
                <div className="flex items-center justify-center h-[300px]">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : trend.months.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No financial data available for this property
                </div>
            ) : (
                <>
                    <Chart
                        key={selectedProperty} // ✅ STRING KEY → REMOUNT WORKS
                        options={options}
                        series={series}
                        type="line"
                        height={400}
                    />
                    <p className="text-xs text-gray-500 text-center">
                        Monthly revenue vs expenses per property
                    </p>
                </>
            )}
        </div>
    );
}
