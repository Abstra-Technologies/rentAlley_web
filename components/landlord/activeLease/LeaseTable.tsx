"use client";

import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void;
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
    onKyp: (lease: any) => void; // eKYP handler
}

export default function LeaseTable({
                                       leases,
                                       onPrimary,
                                       onExtend,
                                       onEnd,
                                       onKyp,
                                   }: Props) {
    return (
        <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-gray-700">
                {/* ================= HEADER ================= */}
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-3 py-3 text-center">Start</th>
                    <th className="px-3 py-3 text-center">End</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">eKYP ID</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
                </thead>

                {/* ================= BODY ================= */}
                <tbody className="divide-y">
                {leases.map((lease) => {
                    const status = getStatus(lease);
                    const canViewKyp =
                        status === "active" || status === "expired";

                    return (
                        <tr
                            key={lease.agreement_id}
                            className="hover:bg-gray-50 transition-colors"
                        >
                            {/* Unit */}
                            <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                    {lease.unit_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {lease.tenant_name || "—"}
                                </div>
                            </td>

                            {/* Start Date */}
                            <td className="px-3 py-3 text-center text-gray-600">
                                {lease.start_date
                                    ? new Date(lease.start_date).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* End Date */}
                            <td className="px-3 py-3 text-center text-gray-600">
                                {lease.end_date
                                    ? new Date(lease.end_date).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 text-center">
                                <StatusBadge lease={lease} />
                            </td>

                            {/* eKYP ID */}
                            <td className="px-3 py-3 text-center">
                                {canViewKyp ? (
                                    <button
                                        onClick={() => onKyp(lease)}
                                        className="px-3 py-1.5 text-xs font-medium
                                                       bg-indigo-600 text-white
                                                       rounded-md hover:bg-indigo-700
                                                       focus:outline-none focus:ring-2 focus:ring-indigo-300
                                                       transition"
                                    >
                                        View ID
                                    </button>
                                ) : (
                                    <span className="inline-flex px-3 py-1.5 text-xs
                                                         bg-gray-100 text-gray-400
                                                         rounded-md cursor-not-allowed">
                                            N/A
                                        </span>
                                )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right space-x-1">
                                {/* Draft */}
                                {status === "draft" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-xs font-medium
                                                       bg-blue-600 text-white rounded-md
                                                       hover:bg-blue-700 transition"
                                    >
                                        Setup
                                    </button>
                                )}

                                {/* Expired */}
                                {status === "expired" && (
                                    <>
                                        <button
                                            onClick={() => onExtend(lease)}
                                            className="px-3 py-1.5 text-xs font-medium
                                                           bg-emerald-600 text-white rounded-md
                                                           hover:bg-emerald-700 transition"
                                        >
                                            Extend
                                        </button>
                                        <button
                                            onClick={() => onEnd(lease)}
                                            className="px-3 py-1.5 text-xs font-medium
                                                           bg-red-600 text-white rounded-md
                                                           hover:bg-red-700 transition"
                                        >
                                            End
                                        </button>
                                    </>
                                )}

                                {/* Active */}
                                {status === "active" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-xs font-medium
                                                       bg-gray-800 text-white rounded-md
                                                       hover:bg-black transition"
                                    >
                                        View
                                    </button>
                                )}

                                {/* Fallback */}
                                {!["draft", "expired", "active"].includes(status) && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-xs font-medium
                                                       bg-gray-800 text-white rounded-md
                                                       hover:bg-black transition"
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
