"use client";

import { FileText, Clock, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

interface LeaseItem {
    lease_id?: string;
    type: "draft" | "ending" | "prospective";
    unit: string;
    tenant: string;
    note: string;
    daysLeft?: number;
}

interface Props {
    landlord_id: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LeaseOccupancyCard({ landlord_id }: Props) {
    const router = useRouter();

    const { data: leases = [], isLoading, error } = useSWR<LeaseItem[]>(
        landlord_id
            ? `/api/landlord/leases/attention?landlord_id=${landlord_id}`
            : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const prospective = leases.filter((l) => l.type === "prospective");
    const ending = leases.filter((l) => l.type === "ending");
    const drafts = leases.filter((l) => l.type === "draft");

    const renderItem = (lease: LeaseItem, idx: number) => (
        <div
            key={`${lease.type}-${idx}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
        >
            {/* Icon */}
            <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center
        ${
                    lease.type === "draft"
                        ? "bg-indigo-50 text-indigo-600"
                        : lease.type === "ending"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-emerald-50 text-emerald-600"
                }`}
            >
                {lease.type === "draft" ? (
                    <FileText className="w-4 h-4" />
                ) : lease.type === "ending" ? (
                    <Clock className="w-4 h-4" />
                ) : (
                    <Users className="w-4 h-4" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                    {lease.unit}
                </p>
                <p className="text-xs text-gray-600 truncate">{lease.tenant}</p>
                <p className="text-xs text-gray-400 truncate">{lease.note}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {lease.daysLeft !== undefined && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
            {lease.daysLeft}d
          </span>
                )}

                {lease.type === "draft" && (
                    <button
                        onClick={() =>
                            router.push(
                                `/pages/landlord/${landlord_id}/leases/create${
                                    lease.lease_id ? `?from=${lease.lease_id}` : ""
                                }`
                            )
                        }
                        className="flex items-center gap-1 text-xs font-semibold
              px-2.5 py-1 rounded-md
              bg-gradient-to-r from-indigo-500 to-purple-500
              text-white hover:opacity-90"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate
                    </button>
                )}
            </div>
        </div>
    );

    const renderEmpty = (text: string) => (
        <div className="px-4 py-3 text-xs text-gray-400 italic">{text}</div>
    );

    return (
        <div className="bg-white rounded-xl border shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b">
                <h3 className="text-sm font-semibold text-gray-900">
                    Lease & Occupancy
                </h3>
            </div>

            {isLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading lease activity…
                </div>
            ) : error ? (
                <div className="px-4 py-6 text-center text-sm text-red-500">
                    Failed to load lease data
                </div>
            ) : (
                <>
                    <Section title="Prospective" count={prospective.length}>
                        {prospective.length
                            ? prospective.map(renderItem)
                            : renderEmpty("No prospective tenants")}
                    </Section>

                    <Section title="Lease Ending" count={ending.length}>
                        {ending.length
                            ? ending.map(renderItem)
                            : renderEmpty("No leases ending soon")}
                    </Section>

                    <Section title="Draft Leases" count={drafts.length}>
                        {drafts.length
                            ? drafts.map(renderItem)
                            : renderEmpty("No draft leases")}
                    </Section>
                </>
            )}
        </div>
    );
}

/* ================= SECTION ================= */
function Section({
                     title,
                     count,
                     children,
                 }: {
    title: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
        <span className="text-xs font-semibold text-gray-700 uppercase">
          {title}
        </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
          {count}
        </span>
            </div>
            <div className="divide-y">{children}</div>
        </div>
    );
}
