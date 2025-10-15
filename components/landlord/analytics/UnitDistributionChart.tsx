"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Unit = {
    unit_id: number;
    unit_name: string;
    furnish: string; // or unit_type if available
    property_id: number;
    status: string;
    property_name?: string;
};

type Props = {
    landlordId: number | string;
};

export default function UnitDistributionChart({ landlordId }: Props) {
    const [units, setUnits] = useState<Unit[]>([]);
    const [series, setSeries] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        // Fetch all units belonging to this landlord (across all properties)
        fetch(`/api/landlord/analytics/units?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data: Unit[]) => {
                setUnits(data);

                // Group by furnishing type
                const distribution: Record<string, number> = {};
                data.forEach((unit) => {
                    const key = unit.furnish || "Unspecified";
                    distribution[key] = (distribution[key] || 0) + 1;
                });

                setLabels(Object.keys(distribution));
                setSeries(Object.values(distribution));
            })
            .catch((error) => console.error("Failed to fetch landlord units:", error));
    }, [landlordId]);

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "pie",
            toolbar: { show: false },
        },
        labels,
        colors: [
            "#2563eb", // blue
            "#0ea5e9", // sky
            "#10b981", // green
            "#facc15", // yellow
            "#f97316", // orange
            "#ef4444", // red
        ],
        title: {
            text: "Unit Distribution (All Properties)",
            align: "left",
            style: {
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
            },
        },
        legend: {
            position: "bottom",
            fontSize: "14px",
        },
        dataLabels: {
            formatter: (val: number, opts) =>
                `${opts.w.config.labels[opts.seriesIndex]}: ${val.toFixed(1)}%`,
        },
        tooltip: {
            y: {
                formatter: (value) => `${value} unit${value > 1 ? "s" : ""}`,
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <Chart options={chartOptions} series={series} type="pie" height={320} />
        </div>
    );
}
