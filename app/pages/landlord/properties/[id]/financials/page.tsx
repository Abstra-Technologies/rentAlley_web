"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { useParams } from "next/navigation";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Line } from "react-chartjs-2";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function FinancialsPage() {
    const { id } = useParams();
    const propertyId = id;

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const { data, error, isLoading } = useSWR(
        propertyId
            ? `/api/analytics/landlord/revenue-expense-trend?property_id=${propertyId}&year=${selectedYear}`
            : null,
        fetcher
    );

    const metrics = data?.metrics || {};

    const chartDataNOI = {
        labels: metrics.monthNames || [],
        datasets: [
            {
                label: "Month NOI",
                data: metrics.noiTrend || [],
                borderWidth: 3,
            },
        ],
    };

    const chartGrossRent = {
        labels: metrics.monthNames || [],
        datasets: [
            {
                label: "Gross Rent",
                data: metrics.grossRentTrend || [],
                borderWidth: 3,
            },
        ],
    };

    return (
        <div className="min-h-screen p-5 bg-gray-50">

            <h1 className="text-2xl font-bold text-gray-800 mt-4">
                Financial Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
                Showing financial analytics for property #{propertyId}
            </p>

            {/* YEAR FILTER ONLY */}
            <div className="flex gap-3 mt-5">
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 border rounded-lg shadow-sm"
                >
                    <option>{new Date().getFullYear()}</option>
                    <option>{new Date().getFullYear() - 1}</option>
                </select>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

                <Card
                    title="Net Operating Income (NOI)"
                    subtitle="Month to Month"
                    current={formatCurrency(metrics.noi?.mtm?.current)}
                    last={formatCurrency(metrics.noi?.mtm?.last)}
                    variance={metrics.noi?.mtm?.variance}
                />

                <Card
                    title="Net Operating Income (NOI)"
                    subtitle="Year To Date"
                    current={formatCurrency(metrics.noi?.ytd?.current)}
                    last={formatCurrency(metrics.noi?.ytd?.last)}
                    variance={metrics.noi?.ytd?.variance}
                />

                <Card
                    title="Net Operating Income (NOI)"
                    subtitle="Year Over Year"
                    current={formatCurrency(metrics.noi?.yoy?.current)}
                    last={formatCurrency(metrics.noi?.yoy?.last)}
                    variance={metrics.noi?.yoy?.variance}
                />

            </div>

            {/* NOI CHART */}
            <div className="bg-white p-5 shadow-md rounded-xl mt-6">
                <h2 className="font-semibold mb-3">Monthly NOI Trend</h2>
                <Line data={chartDataNOI} />
            </div>

            {/* GROSS RENT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

                <Card
                    title="Gross Rent"
                    subtitle="Month to Month"
                    current={formatCurrency(metrics.grossRent?.mtm?.current)}
                    last={formatCurrency(metrics.grossRent?.mtm?.last)}
                    variance={metrics.grossRent?.mtm?.variance}
                />

                <Card
                    title="Gross Rent"
                    subtitle="Year To Date"
                    current={formatCurrency(metrics.grossRent?.ytd?.current)}
                    last={formatCurrency(metrics.grossRent?.ytd?.last)}
                    variance={metrics.grossRent?.ytd?.variance}
                />

                <Card
                    title="Gross Rent"
                    subtitle="Year Over Year"
                    current={formatCurrency(metrics.grossRent?.yoy?.current)}
                    last={formatCurrency(metrics.grossRent?.yoy?.last)}
                    variance={metrics.grossRent?.yoy?.variance}
                />

            </div>

            {/* GROSS RENT CHART */}
            <div className="bg-white p-5 shadow-md rounded-xl mt-6">
                <h2 className="font-semibold mb-3">Gross Rent Trend</h2>
                <Line data={chartGrossRent} />
            </div>
        </div>
    );
}

/* ==============
   REUSABLE CARD
   ============== */
function Card({ title, subtitle, current, last, variance }) {
    const positive = variance >= 0;

    return (
        <div className="bg-white shadow-md rounded-xl p-5 border">
            <h3 className="text-gray-800 font-bold">{subtitle}</h3>

            <p className="mt-2 text-3xl font-bold text-black">{current}</p>

            <p className="text-gray-500 text-sm -mt-1">Last: {last}</p>

            <p
                className={`mt-3 font-semibold ${
                    positive ? "text-green-600" : "text-red-600"
                }`}
            >
                {positive ? "+" : ""}
                {variance?.toFixed(2)}%
            </p>
        </div>
    );
}
