"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";

interface AgeGroupData {
    age_group: string;
    tenant_count: number;
}

export default function TenantAgeGroupChart({
                                                landlordId,
                                            }: {
    landlordId: number;
}) {
    const [data, setData] = useState<AgeGroupData[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        fetch(`/api/analytics/landlord/getTenantAgeGroups?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setData(data);
                else setData([]);
            })
            .catch((error) =>
                console.error("Error fetching tenant age group data:", error)
            );
    }, [landlordId]);

    const ageGroups = data.map((d) => d.age_group);
    const tenantCounts = data.map((d) => d.tenant_count);

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
        dataLabels: { enabled: false },
        xaxis: {
            categories: ageGroups,
            title: {
                text: "Age Group",
                style: { color: "#374151", fontWeight: 600, fontSize: "13px" },
            },
            labels: { style: { colors: "#6B7280", fontSize: "12px" } },
        },
        yaxis: {
            title: {
                text: "Number of Tenants",
                style: { color: "#374151", fontWeight: 600, fontSize: "13px" },
            },
            labels: { style: { colors: "#6B7280" } },
        },
        colors: ["#6366F1"],
        tooltip: {
            y: {
                formatter: (val: number) => `${val} tenants`,
            },
        },
        title: {
            text: "Tenant Age Group Distribution",
            align: "center",
            style: { fontSize: "16px", fontWeight: 600, color: "#1F2937" },
        },
    };

    const series = [{ name: "Tenants", data: tenantCounts }];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Tenant Age Group Distribution
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
                    <p className="text-gray-500">No tenant age data available</p>
                    <p className="text-xs text-gray-400">
                        Once tenants’ birth dates are added, age insights will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
