"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Droplets, Zap, AlertCircle, Calendar } from "lucide-react";

/* -------------------------------------------------
   Desktop-only MRT imports
------------------------------------------------- */
import dynamic from "next/dynamic";
import type { MRT_ColumnDef } from "material-react-table";

const MaterialReactTable = dynamic(
    () =>
        import("material-react-table").then((mod) => mod.MaterialReactTable),
    { ssr: false }
);

export default function ConcessionaireBillingHistory({
                                                         propertyId,
                                                     }: {
    propertyId: number;
}) {
    const [billings, setBillings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    /* ---------------- Viewport Detection ---------------- */
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    /* ---------------- Data Fetch ---------------- */
    useEffect(() => {
        if (!propertyId) return;
        fetchData();
    }, [propertyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/api/landlord/properties/getConcessionaireHistory?property_id=${propertyId}`
            );
            setBillings(res.data.billings || []);
        } catch {
            Swal.fire(
                "Error",
                "Failed to fetch concessionaire billing history.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- Totals ---------------- */
    const totals = useMemo(() => ({
        water: billings.reduce(
            (sum, b) => sum + Number(b.water_consumption || 0),
            0
        ),
        electricity: billings.reduce(
            (sum, b) => sum + Number(b.electricity_consumption || 0),
            0
        ),
    }), [billings]);

    /* ---------------- Desktop Columns ---------------- */
    const columns: MRT_ColumnDef<any>[] = [
        {
            accessorKey: "period_start",
            header: "Period",
            size: 160,
            Cell: ({ row }) => (
                <span className="truncate block">
          {new Date(row.original.period_start).toLocaleDateString("en-PH", {
              month: "short",
              year: "numeric",
          })}{" "}
                    –{" "}
                    {new Date(row.original.period_end).toLocaleDateString("en-PH", {
                        month: "short",
                        year: "numeric",
                    })}
        </span>
            ),
        },
        { accessorKey: "water_consumption", header: "Water (m³)", size: 110 },
        { accessorKey: "water_rate", header: "Water Rate", size: 110 },
        {
            accessorKey: "water_total",
            header: "Water Total",
            size: 120,
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
        { accessorKey: "electricity_consumption", header: "Elec (kWh)", size: 120 },
        { accessorKey: "electricity_rate", header: "Elec Rate", size: 120 },
        {
            accessorKey: "electricity_total",
            header: "Elec Total",
            size: 120,
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
    ];

    /* ---------------- Loading ---------------- */
    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                ))}
            </div>
        );
    }

    /* ---------------- Empty ---------------- */
    if (!billings.length) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                <AlertCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">
                    No Utility Records Found
                </p>
                <p className="text-sm text-gray-500">
                    No concessionaire billing data available.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ---------------- Summary ---------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard
                    icon={<Droplets className="w-5 h-5 text-white" />}
                    title="Total Water Consumption"
                    value={`${totals.water.toFixed(2)} m³`}
                    color="bg-blue-600"
                />
                <SummaryCard
                    icon={<Zap className="w-5 h-5 text-white" />}
                    title="Total Electricity Consumption"
                    value={`${totals.electricity.toFixed(2)} kWh`}
                    color="bg-amber-600"
                />
            </div>

            {/* ---------------- MOBILE (NO MRT) ---------------- */}
            {isMobile && (
                <div className="space-y-4">
                    {billings.map((b) => (
                        <div key={b.bill_id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(b.period_start).toLocaleDateString("en-PH", {
                                    month: "short",
                                    year: "numeric",
                                })}{" "}
                                –{" "}
                                {new Date(b.period_end).toLocaleDateString("en-PH", {
                                    month: "short",
                                    year: "numeric",
                                })}
                            </div>

                            <Row label="Water Consumption" value={`${b.water_consumption} m³`} />
                            <Row label="Water Total" value={formatCurrency(b.water_total)} bold />

                            <Row
                                label="Electricity Consumption"
                                value={`${b.electricity_consumption} kWh`}
                            />
                            <Row
                                label="Electricity Total"
                                value={formatCurrency(b.electricity_total)}
                                bold
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* ---------------- DESKTOP (MRT ONLY) ---------------- */}
            {!isMobile && (
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <MaterialReactTable
                        layoutMode="grid"
                        columns={columns}
                        data={billings}
                        enableTopToolbar={false}
                        enableColumnActions={false}
                        enableColumnFilters={false}
                        enableSorting
                        initialState={{
                            pagination: { pageIndex: 0, pageSize: 10 },
                        }}
                        muiTableContainerProps={{
                            sx: { maxWidth: "100%", overflowX: "hidden" },
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------
   Helpers
------------------------------------------------- */
function SummaryCard({
                         icon,
                         title,
                         value,
                         color,
                     }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
}) {
    return (
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-600">{title}</p>
                <p className="text-lg font-bold">{value}</p>
            </div>
        </div>
    );
}

function Row({
                 label,
                 value,
                 bold,
             }: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{label}</span>
            <span className={bold ? "font-semibold" : ""}>{value}</span>
        </div>
    );
}
