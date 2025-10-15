"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LeaseDurationData {
    property_id: number;
    property_name: string;
    avg_lease_months: number;
}

export default function AverageLeaseDurationChart({
                                                      landlordId,
                                                  }: {
    landlordId: number;
}) {
    const [data, setData] = useState<LeaseDurationData[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        fetch(`/api/analytics/landlord/getAverageLeaseDuration?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setData(data);
                else setData([]);
            })
            .catch((error) =>
                console.error("Error fetching average lease duration:", error)
            );
    }, [landlordId]);

    const propertyNames = data.map((d) => d.property_name);
    const avgDurations = data.map((d) => d.avg_lease_months);

    const chartOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            animations: { easing: "easeinout", speed: 800 },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "45%",
                borderRadius: 6,
            },
        },
        dataLabels: { enabled: true },
        xaxis: {
            categories: propertyNames,
            title: {
                text: "Properties",
                style: { color: "#374151", fontWeight: 600, fontSize: "13px" },
            },
            labels: { style: { colors: "#6B7280", fontSize: "12px" } },
        },
        yaxis: {
            title: {
                text: "Average Lease Duration (Months)",
                style: { color: "#374151", fontWeight: 600, fontSize: "13px" },
            },
            labels: { style: { colors: "#6B7280" } },
        },
        colors: ["#10B981"],
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toFixed(1)} months`,
            },
        },
        title: {
            text: "Average Lease Duration per Property",
            align: "center",
            style: { fontSize: "16px", fontWeight: 600, color: "#1F2937" },
        },
    };

    const series = [{ name: "Avg Duration (Months)", data: avgDurations }];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Average Lease Duration
            </h3>
            {data.length > 0 ? (
                <Chart
                    // @ts-ignore
                    options={chartOptions}
                    series={series}
                    type="bar"
                    height={380}
                />
            ) : (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                    <p className="text-gray-500">No lease duration data available</p>
                    <p className="text-xs text-gray-400">
                        Once leases have both start and end dates, average durations will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
