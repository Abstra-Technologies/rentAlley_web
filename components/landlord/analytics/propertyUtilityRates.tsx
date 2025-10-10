"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";

type UtilityRate = {
    property_id: number;
    property_name: string;
    avg_water_consumption: number;
    avg_electricity_consumption: number;
};

type Props = {
    landlordId: number | string;
};

export default function PropertyUtilitiesChart({ landlordId }: Props) {
    const [utilityRates, setUtilityRates] = useState<UtilityRate[]>([]);

    useEffect(() => {
        if (!landlordId) return;

        fetch(
            `/api/analytics/landlord/getAveragePropertyUtilityRate?landlord_id=${landlordId}`
        )
            .then((res) => res.json())
            .then((data) => {
                console.log("Average Utility Data:", data);
                if (Array.isArray(data)) setUtilityRates(data);
                else setUtilityRates([]);
            })
            .catch((error) =>
                console.error("Error fetching property utility data:", error)
            );
    }, [landlordId]);

    const propertyNames = utilityRates.map((item) => item.property_name);
    const waterRates = utilityRates.map(
        (item) => item.avg_water_consumption || 0
    );
    const electricityRates = utilityRates.map(
        (item) => item.avg_electricity_consumption || 0
    );

    const chartOptionsPropertyUtilities = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            animations: { easing: "easeinout", speed: 800 },
        },
        plotOptions: {
            bar: {
                horizontal: false, // ✅ vertical bars
                columnWidth: "45%",
                borderRadius: 6,
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
            categories: propertyNames,
            labels: {
                style: { colors: "#6B7280", fontSize: "12px", fontWeight: 500 },
            },
            title: { text: "Properties", style: { color: "#374151" } },
        },
        yaxis: {
            title: {
                text: "Average Consumption",
                style: { color: "#374151", fontSize: "13px", fontWeight: 600 },
            },
            labels: { style: { colors: "#6B7280" } },
        },
        legend: {
            position: "top",
            horizontalAlign: "right",
            labels: { colors: "#374151" },
        },
        colors: ["#3B82F6", "#F59E0B"], // Water (blue), Electricity (amber)
        tooltip: {
            theme: "light",
            y: {
                formatter: (val: number) => `${val.toFixed(2)} avg units`,
            },
        },
        title: {
            text: "Average Utility Consumption per Property",
            align: "center",
            style: {
                fontSize: "16px",
                color: "#1F2937",
                fontWeight: 600,
            },
        },
    };

    const seriesPropertyUtilities = [
        { name: "Water Consumption (m³)", data: waterRates },
        { name: "Electricity Consumption (kWh)", data: electricityRates },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Property Utility Consumption
            </h3>
            {utilityRates.length > 0 ? (
                <Chart
                    // @ts-ignore
                    options={chartOptionsPropertyUtilities}
                    series={seriesPropertyUtilities}
                    type="bar"
                    height={380}
                />
            ) : (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                    <p className="text-gray-500">No utility consumption data available</p>
                    <p className="text-xs text-gray-400">
                        Once billing data is recorded, averages will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
