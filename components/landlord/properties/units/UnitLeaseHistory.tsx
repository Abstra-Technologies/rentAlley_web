"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, User, Calendar } from "lucide-react";

export default function UnitLeaseHistory({ unitId }: { unitId: string }) {
    const [leases, setLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [unitId]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(
                `/api/landlord/unit/leaseHistory?unit_id=${unitId}`
            );
            setLeases(res.data || []);
        } catch (err) {
            console.error("Failed to fetch lease history", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-gray-500">Loading lease history…</p>;
    }

    if (leases.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-500">
                No previous leases found for this unit.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {leases.map((lease) => (
                <div
                    key={lease.agreement_id}
                    className="border border-gray-200 rounded-xl p-4 bg-white"
                >
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                {lease.tenant_name}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {lease.start_date} – {lease.end_date}
                            </p>
                        </div>

                        <span
                            className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                lease.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
              {lease.status}
            </span>
                    </div>

                    {lease.is_renewal_of && (
                        <p className="text-xs text-gray-500 mt-2">
                            Renewal of lease #{lease.is_renewal_of}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
