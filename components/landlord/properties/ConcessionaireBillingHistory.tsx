"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function ConcessionaireBillingHistory({
                                                         propertyId,
                                                     }: {
    propertyId: number;
}) {
    const [billings, setBillings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!propertyId) return;
        fetchBillingData();
    }, [propertyId]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/api/landlord/properties/getConcessionaireHistory?property_id=${propertyId}`
            );
            setBillings(res.data.billings || []);
        } catch (err) {
            console.error("❌ Failed to load concessionaire billing:", err);
            Swal.fire(
                "Error",
                "Failed to fetch concessionaire billing history.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // 🧾 Define table columns
    const columns: MRT_ColumnDef<any>[] = [
        {
            accessorKey: "billing_period",
            header: "Billing Period",
            Cell: ({ cell }) =>
                new Date(cell.getValue() as string).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                }),
        },
        {
            accessorKey: "water_consumption",
            header: "Water (m³)",
            Cell: ({ cell }) => Number(cell.getValue() || 0).toFixed(2),
        },
        {
            id: "water_rate",
            header: "Water Rate",
            Cell: ({ row }) => {
                const wCons = Number(row.original.water_consumption || 0);
                const wTotal = Number(row.original.water_total || 0);
                const rate = wCons > 0 ? wTotal / wCons : 0;
                return rate ? `₱${rate.toFixed(2)}/m³` : "-";
            },
        },
        {
            accessorKey: "water_total",
            header: "Water Total",
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
        {
            accessorKey: "electricity_consumption",
            header: "Electricity (kWh)",
            Cell: ({ cell }) => Number(cell.getValue() || 0).toFixed(2),
        },
        {
            id: "electricity_rate",
            header: "Electricity Rate",
            Cell: ({ row }) => {
                const eCons = Number(row.original.electricity_consumption || 0);
                const eTotal = Number(row.original.electricity_total || 0);
                const rate = eCons > 0 ? eTotal / eCons : 0;
                return rate ? `₱${rate.toFixed(2)}/kWh` : "-";
            },
        },
        {
            accessorKey: "electricity_total",
            header: "Electricity Total",
            Cell: ({ cell }) => formatCurrency(cell.getValue()),
        },
        {
            accessorKey: "created_at",
            header: "Created",
            Cell: ({ cell }) =>
                new Date(cell.getValue() as string).toLocaleDateString("en-PH"),
        },
    ];

    // ⏳ Loading state
    if (loading)
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
                Loading concessionaire utility data...
            </div>
        );

    // 🧍 No data
    if (!billings.length)
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center text-gray-500">
                <p>No concessionaire billing records found for this property.</p>
            </div>
        );

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-3 sm:p-6 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                🧾 Concessionaire Utility Cost History
            </h2>
            <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                These records reflect utility costs inputted from concessionaires such as{" "}
                <span className="font-medium text-gray-800">Meralco</span>,{" "}
                <span className="font-medium text-gray-800">Maynilad</span>, or other local providers.{" "}
                They serve as the basis for computing the submetered water and electricity charges
                applied to each tenant unit.
            </p>


            <div className="rounded-xl border border-gray-100 overflow-hidden">
                <MaterialReactTable
                    columns={columns}
                    data={billings}
                    enablePagination
                    enableColumnActions={false}
                    enableColumnFilters={false}
                    enableSorting={true}
                    enableTopToolbar={false}
                    initialState={{
                        density: "comfortable",
                        pagination: { pageIndex: 0, pageSize: 5 },
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
                    muiTableBodyProps={{
                        sx: {
                            "& tr:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
                        },
                    }}
                />
            </div>
        </div>
    );
}
