"use client";

import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void; // setup / view
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
}

export default function LeaseTable({
                                       leases,
                                       onPrimary,
                                       onExtend,
                                       onEnd,
                                   }: Props) {
    return (
        <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm divide-y">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                <tr>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-center">Start</th>
                    <th className="px-3 py-2 text-center">End</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-right">Action</th>
                </tr>
                </thead>

                <tbody className="divide-y">
                {leases.map((lease) => {
                    const status = getStatus(lease);

                    return (
                        <tr
                            key={lease.agreement_id}
                            className="hover:bg-gray-50 transition"
                        >
                            {/* Unit */}
                            <td className="px-4 py-2 font-medium text-gray-800">
                                {lease.unit_name}
                                <div className="text-xs text-gray-500">
                                    {lease.tenant_name || "—"}
                                </div>
                            </td>

                            {/* Start */}
                            <td className="px-3 py-2 text-center text-gray-600">
                                {lease.start_date
                                    ? new Date(lease.start_date).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* End */}
                            <td className="px-3 py-2 text-center text-gray-600">
                                {lease.end_date
                                    ? new Date(lease.end_date).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-2 text-center">
                                <StatusBadge lease={lease} />
                            </td>

                            {/* Actions – SAME AS ORIGINAL PAGE */}
                            <td className="px-4 py-2 text-right space-x-1">
                                {/* Draft */}
                                {status === "draft" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md"
                                    >
                                        Setup
                                    </button>
                                )}

                                {/* Expired */}
                                {status === "expired" && (
                                    <>
                                        <button
                                            onClick={() => onExtend(lease)}
                                            className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-md"
                                        >
                                            Extend
                                        </button>
                                        <button
                                            onClick={() => onEnd(lease)}
                                            className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-md"
                                        >
                                            End
                                        </button>
                                    </>
                                )}

                                {/* Active */}
                                {status === "active" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-2.5 py-1 text-xs bg-gray-800 text-white rounded-md"
                                    >
                                        View
                                    </button>
                                )}

                                {/* Fallback (safety) */}
                                {!["draft", "expired", "active"].includes(status) && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-2.5 py-1 text-xs bg-gray-800 text-white rounded-md"
                                    >
                                        View
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
