import { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import LoadingScreen from '@/components/loadingScreen';
import Link from 'next/link';

const LeaseWidget = ({ landlord_id }) => {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeases = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/analytics/landlord/getLeaseCountDays?landlord_id=${landlord_id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch lease data');
                }

                setLeases(data);
            } catch (err) {
                console.error('API request failed:', err);
                // @ts-ignore
                setError('Unable to load lease information due to an API error.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeases();
    }, [landlord_id]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 w-full">
            <LoadingScreen message="Loading lease information..." />
                </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-4 bg-red-100 border border-red-400 rounded-lg m-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
                </div>
        );
    }

    return (
        <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-4 border border-gray-200 mx-auto">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                📋 Active Leases
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {leases.length}
        </span>
            </h3>
            {leases.length === 0 ? (
                <p className="flex flex-col items-center justify-center text-gray-500 py-6">
                    <Calendar className="w-8 h-8 mb-2 text-gray-400" />
                    <span className="text-sm">No active leases found.</span>
                </p>
            ) : (
                <>
                    <ul className="divide-y divide-gray-100">
                        {leases.slice(0, 5).map(lease => (
                            <li
                                key={lease.agreement_id}
                                className="py-3 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold">
                                        {lease.unit_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {lease.property_name} - {lease.unit_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Ends: {new Date(lease.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                  <span
                      className={`px-2 py-1 text-xs rounded-lg font-medium ${
                          lease.daysRemaining <= 30
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                      }`}
                  >
                    {lease.daysRemaining > 0
                        ? `${lease.daysRemaining} days left`
                        : 'Expired'}
                  </span>
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                </div>
                            </li>
                        ))}
                    </ul>
                    {leases.length > 5 && (
                        <div className="mt-4 text-center">
                            <Link
                                href="/pages/landlord/contracts"
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Show All
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );

};

export default LeaseWidget;