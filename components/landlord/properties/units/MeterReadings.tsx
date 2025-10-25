"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function MeterReadings({ unitId }: { unitId: number }) {
    const [readings, setReadings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!unitId) return;
        fetchReadings();
    }, [unitId]);

    const fetchReadings = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/properties/units/meterReadings?unit_id=${unitId}`);
            setReadings(res.data.readings || []);
        } catch (err) {
            console.error("❌ Failed to load readings:", err);
            Swal.fire("Error", "Failed to fetch meter readings.", "error");
        } finally {
            setLoading(false);
        }
    };

    // 🧾 Define table columns
    const columns: MRT_ColumnDef<any>[] = [
        {
            accessorKey: "utility_type",
            header: "Utility",
            Cell: ({ cell }) => (
                <div className="flex items-center gap-1 font-medium text-gray-800 capitalize">
                    {cell.getValue() === "water" ? "💧 Water" : "⚡ Electricity"}
                </div>
            ),
        },
        {
            accessorKey: "reading_date",
            header: "Date",
            Cell: ({ cell }) =>
                new Date(cell.getValue() as string).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
        },
        {
            accessorKey: "previous_reading",
            header: "Previous",
            Cell: ({ cell }) => <span>{Number(cell.getValue() || 0)}</span>,
        },
        {
            accessorKey: "current_reading",
            header: "Current",
            Cell: ({ cell }) => <span>{Number(cell.getValue() || 0)}</span>,
        },
        {
            id: "usage",
            header: "Usage",
            Cell: ({ row }) => {
                const prev = Number(row.original.previous_reading || 0);
                const curr = Number(row.original.current_reading || 0);
                return <span>{Math.max(curr - prev, 0).toFixed(2)}</span>;
            },
        },
        {
            id: "rate",
            header: "Rate × Usage = Total",
            Cell: ({ row }) => {
                const r = row.original;
                const prev = Number(r.previous_reading || 0);
                const curr = Number(r.current_reading || 0);
                const usage = Math.max(curr - prev, 0);
                const rate =
                    r.utility_type === "water"
                        ? Number(r.water_rate || 0)
                        : Number(r.electricity_rate || 0);
                const total = usage * rate;
                return rate > 0 ? (
                    <div className="text-emerald-700 font-semibold">
                        ₱{rate.toFixed(2)} × {usage.toFixed(2)} ={" "}
                        <span className="text-emerald-900">{formatCurrency(total)}</span>
                    </div>
                ) : (
                    "-"
                );
            },
        },
    ];

    // ⏳ Loading state
    if (loading)
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
                Loading meter readings...
            </div>
        );

    // 🧍‍♂️ No data fallback
    if (!readings.length)
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
                <p>No meter readings found for this unit.</p>
            </div>
        );

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-3 sm:p-6 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                📊 Meter Readings
            </h2>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
                <MaterialReactTable
                    columns={columns}
                    data={readings}
                    enablePagination
                    enableColumnActions={false}
                    enableColumnFilters={false}
                    enableSorting={true}
                    enableTopToolbar={false}
                    initialState={{
                        density: "comfortable",
                        pagination: { pageIndex: 0, pageSize: 5 },
                    }}
                    muiTableBodyProps={{
                        sx: {
                            "& tr:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
                        },
                    }}
                    muiTableContainerProps={{
                        sx: { maxHeight: "500px" },
                        className: "overflow-x-auto",
                    }}
                    muiTableHeadCellProps={{
                        sx: {
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            backgroundColor: "#f8fafc",
                        },
                    }}
                />
            </div>
        </div>
    );
}
