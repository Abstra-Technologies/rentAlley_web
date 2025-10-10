"use client";
import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";

const TenantOccupationChart = ({ landlordId }: { landlordId: number }) => {
    const [occupationData, setOccupationData] = useState<any[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        fetch(`/api/analytics/landlord/getTenantOccupations?landlord_id=${landlordId}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setOccupationData(data);
                else setOccupationData([]);
            })
            .catch((error) =>
                console.error("Error fetching tenant occupation data:", error)
            );
    }, [landlordId]);

    const labels = occupationData.map((item) => item.occupation || "Unknown");
    const values = occupationData.map((item) => item.tenant_count);

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                    Tenant Occupations
                </h3>
                {occupationData.length > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            {occupationData.reduce((a, b) => a + (b.tenant_count || 0), 0)} tenants
          </span>
                )}
            </div>

            {/* Chart */}
            {occupationData.length > 0 ? (
                <BarChart
                    xAxis={[{ scaleType: "band", data: labels }]}
                    series={[{ data: values, color: "#3B82F6" }]}
                    height={400}
                />
            ) : (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                    <p className="text-gray-500">No tenant occupation data available</p>
                    <p className="text-xs text-gray-400">
                        Once tenants are onboarded, their occupations will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TenantOccupationChart;
