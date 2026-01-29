"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

/* ================= TYPES ================= */
interface EndingLease {
    lease_id?: string;
    property_id: string;
    type: "ending";
    unit: string;
    tenant: string;
    note: string;
    daysLeft?: number;
}

interface Props {
    landlord_id: string;
}

/* ================= FETCHER ================= */
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

/* ================= COMPONENT ================= */
export default function EndingLeaseCard({ landlord_id }: Props) {
    const router = useRouter();

    const { data = [], isLoading, error } = useSWR<EndingLease[]>(
        landlord_id
            ? `/api/landlord/leases/attention?landlord_id=${landlord_id}`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const endingLeases = data.filter((l) => l.type === "ending");

    /* ================= ITEM ================= */
    const LeaseRow = (lease: EndingLease, idx: number) => (
        <div
            key={`ending-${idx}`}
            onClick={() =>
                router.push(
                    `/pages/landlord/properties/${lease.property_id}/activeLease`
                )
            }
            className="
        flex items-center gap-3 px-4 py-3 cursor-pointer
        hover:bg-orange-50 transition
      "
        >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                    {lease.unit}
                </p>
                <p className="text-xs text-gray-600 truncate">{lease.tenant}</p>
                <p className="text-xs text-gray-400 truncate">{lease.note}</p>
            </div>

            {/* Days Left */}
            {lease.daysLeft !== undefined && (
                <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full
            ${
                        lease.daysLeft <= 7
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                    }`}
                >
          {lease.daysLeft}d
        </span>
            )}
        </div>
    );

    /* ================= RENDER ================= */
    return (
        <div
            className="
        bg-white rounded-xl border shadow-sm
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-0.5
      "
        >
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                    Leases Near Ending
                </h3>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
          {endingLeases.length}
        </span>
            </div>

            {isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading ending leases…
                </div>
            ) : error ? (
                <div className="px-4 py-6 text-center text-sm text-red-500">
                    Failed to load ending leases
                </div>
            ) : endingLeases.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
                    No leases ending soon
                </div>
            ) : (
                <div className="max-h-[180px] overflow-y-auto divide-y">
                    {endingLeases.slice(0, 3).map(LeaseRow)}
                </div>
            )}
        </div>
    );
}
