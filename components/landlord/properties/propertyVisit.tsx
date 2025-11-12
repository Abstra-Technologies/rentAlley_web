import { useEffect, useState } from "react";

// @ts-ignore
export default function UpcomingVisitsWidget({ landlordId }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!landlordId) return;

        async function fetchVisits() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/landlord/propertyVisits/${landlordId}/upcoming-visits`);
                if (!res.ok) throw new Error("Failed to fetch visits");
                const data = await res.json();
                setVisits(data);
            } catch (err) {
                // @ts-ignore
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchVisits();
    }, [landlordId]);

    if (loading) return <div>Loading upcoming visits...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    // @ts-ignore
    return (
        <div className="relative w-full max-w-2xl mx-auto flex justify-center px-3 sm:px-0 transition-all duration-300">
            <div
                className="w-full bg-gradient-to-br from-emerald-50/80 via-teal-50/70 to-blue-50/80
      border border-gray-200 rounded-2xl shadow-sm sm:shadow-md
      p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
            >
                {/* Header */}
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-md shadow-inner text-white">
          📅
        </span>
                    Upcoming Property Visits
                </h3>

                {/* Empty State */}
                {visits.length === 0 ? (
                    <div className="flex items-center justify-center py-10 sm:py-12">
                        <div className="bg-white/80 border border-gray-200 rounded-xl p-6 text-center shadow-sm w-full transition-all duration-200 hover:shadow-md">
                            <div className="text-4xl mb-2">🏡</div>
                            <p className="text-sm font-medium text-gray-700">No upcoming visits</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Scheduled visits will appear here once available.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {visits.map((visit) => (
                            <li
                                key={visit?.visit_id}
                                className="py-3 sm:py-4 px-2 sm:px-3 rounded-lg border border-gray-100 bg-white/70
              hover:border-emerald-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50
              transition-all duration-200"
                            >
                                {/* Property & Date */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <div className="text-gray-800 font-semibold text-sm sm:text-base">
                                        {visit?.property_name} — {visit?.unit_name}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">
                                        {new Date(visit?.visit_date).toLocaleDateString()} ·{" "}
                                        {visit?.visit_time?.slice(0, 5)}
                                    </div>
                                </div>

                                {/* Tenant & Status */}
                                <div className="mt-1.5 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-600">
                                    <p>
                                        Tenant:{" "}
                                        <span className="italic font-medium text-gray-700">
                    {visit?.tenant_name}
                  </span>
                                    </p>
                                    <p className="mt-0.5 sm:mt-0">
                                        Status:{" "}
                                        <span
                                            className={`capitalize font-semibold ${
                                                visit.status === "approved"
                                                    ? "text-emerald-600"
                                                    : visit.status === "pending"
                                                        ? "text-blue-600"
                                                        : visit.status === "cancelled"
                                                            ? "text-red-600"
                                                            : "text-gray-600"
                                            }`}
                                        >
                    {visit.status}
                  </span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );


}
