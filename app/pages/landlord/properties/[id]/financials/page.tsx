"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "@/utils/formatter/formatters";
import { ChevronDown, ChevronUp } from "lucide-react";

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

    // chart visibility toggles
    const [showNOIChart, setShowNOIChart] = useState(false);
    const [showGrossChart, setShowGrossChart] = useState(false);

    const { data } = useSWR(
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
                label: "NOI Trend",
                data: metrics.noiTrend || [],
                borderWidth: 2,
                tension: 0.3,
            },
        ],
    };

    const chartGrossRent = {
        labels: metrics.monthNames || [],
        datasets: [
            {
                label: "Gross Rent Trend",
                data: metrics.grossRentTrend || [],
                borderWidth: 2,
                tension: 0.3,
            },
        ],
    };

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">

            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                    Financial Dashboard
                </h1>
                <p className="text-gray-500 mt-1">
                    Financial insights for <span className="font-semibold">Property #{propertyId}</span>
                </p>
            </div>

            {/* YEAR FILTER */}
            <div className="flex items-center gap-3 mb-6">
                <label className="font-medium text-gray-700">Year:</label>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-4 py-2 border rounded-lg shadow-sm bg-white hover:border-gray-400"
                >
                    <option>{new Date().getFullYear()}</option>
                    <option>{new Date().getFullYear() - 1}</option>
                </select>
            </div>

            {/* SECTION TITLE */}
            <h2 className="text-xl font-bold text-gray-800 mt-4 mb-2">Net Operating Income (NOI)</h2>

            {/* NOI METRIC GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                <MetricCard
                    label="Month to Month"
                    value={formatCurrency(metrics.noi?.mtm?.current)}
                    last={formatCurrency(metrics.noi?.mtm?.last)}
                    variance={metrics.noi?.mtm?.variance}
                />

                <MetricCard
                    label="Year to Date"
                    value={formatCurrency(metrics.noi?.ytd?.current)}
                    last={formatCurrency(metrics.noi?.ytd?.last)}
                    variance={metrics.noi?.ytd?.variance}
                />

                <MetricCard
                    label="Year Over Year"
                    value={formatCurrency(metrics.noi?.yoy?.current)}
                    last={formatCurrency(metrics.noi?.yoy?.last)}
                    variance={metrics.noi?.yoy?.variance}
                />
            </div>

            {/* NOI CHART - COLLAPSIBLE */}
            <ChartSection
                title="Monthly NOI Trend"
                isOpen={showNOIChart}
                onToggle={() => setShowNOIChart(!showNOIChart)}
            >
                <Line data={chartDataNOI} />
            </ChartSection>

            {/* SECTION TITLE */}
            <h2 className="text-xl font-bold text-gray-800 mt-10 mb-2">Gross Rent</h2>

            {/* GROSS RENT METRIC GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                <MetricCard
                    label="Month to Month"
                    value={formatCurrency(metrics.grossRent?.mtm?.current)}
                    last={formatCurrency(metrics.grossRent?.mtm?.last)}
                    variance={metrics.grossRent?.mtm?.variance}
                />

                <MetricCard
                    label="Year to Date"
                    value={formatCurrency(metrics.grossRent?.ytd?.current)}
                    last={formatCurrency(metrics.grossRent?.ytd?.last)}
                    variance={metrics.grossRent?.ytd?.variance}
                />

                <MetricCard
                    label="Year Over Year"
                    value={formatCurrency(metrics.grossRent?.yoy?.current)}
                    last={formatCurrency(metrics.grossRent?.yoy?.last)}
                    variance={metrics.grossRent?.yoy?.variance}
                />
            </div>

            {/* GROSS RENT CHART - COLLAPSIBLE */}
            <ChartSection
                title="Gross Rent Trend"
                isOpen={showGrossChart}
                onToggle={() => setShowGrossChart(!showGrossChart)}
            >
                <Line data={chartGrossRent} />
            </ChartSection>
        </div>
    );
}

/* ======================================
   METRIC CARD (unchanged, simple clean)
====================================== */
function MetricCard({ label, value, last, variance }) {
    const isPositive = variance >= 0;

    return (
        <div className="bg-white p-5 rounded-xl shadow-md border hover:shadow-lg transition-all">
            <p className="text-gray-600 text-sm font-medium">{label}</p>

            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm">Last: {last}</p>

            <p
                className={`mt-3 text-sm font-semibold ${
                    isPositive ? "text-green-600" : "text-red-600"
                }`}
            >
                {isPositive ? "+" : ""}
                {variance?.toFixed(2)}%
            </p>
        </div>
    );
}

/* ======================================
   CHART SECTION WITH TOGGLE + ANIMATION
====================================== */
function ChartSection({ title, children, isOpen, onToggle }) {
    return (
        <div className="bg-white p-5 shadow-md rounded-xl border mt-6">

            {/* Toggle Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between text-left"
            >
                <h3 className="font-semibold text-gray-800">{title}</h3>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
            </button>

            {/* Smooth Expand */}
            <div
                className={`overflow-hidden transition-all duration-500 ${
                    isOpen ? "max-h-[500px] mt-4 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
}
