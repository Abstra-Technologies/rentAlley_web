'use client';

import { useEffect, useState } from 'react';
import { FaFile } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Application = {
    id: number;
    unit_id: number | null;
    valid_id: string;
    proof_of_income?: string;
    message?: string;
    status: 'pending' | 'approved' | 'disapproved';
    created_at: string;
    updated_at: string;
};

export default function MyApplications({ tenantId }: { tenantId: number }) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await fetch(`/api/tenant/applications/listofApplications?tenantId=${tenantId}`);
                const result = await res.json();

                if (!res.ok) {
                     new Error(result.message || 'Failed to fetch applications.');
                }

                if (Array.isArray(result)) {
                    setApplications(result);
                } else if (Array.isArray(result.applications)) {
                    setApplications(result.applications);
                } else {
                     new Error('Unexpected response format.');
                }
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        if (tenantId) {
            fetchApplications();
        } else {
            router.push('/tenant/login');
        }
    }, [tenantId, router]);

    if (loading) return <div className="p-4">Loading applications...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FaFile className="text-indigo-600" />
                My Rental Applications
            </h1>

            {applications.length === 0 ? (
                <p>No applications found.</p>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <div key={app.id} className="border rounded-lg p-4 shadow-sm">
                            <p><strong>Unit ID:</strong> {app.unit_id ?? 'N/A'}</p>
                            <p><strong>Status:</strong> <span className={`capitalize ${getStatusColor(app.status)}`}>{app.status}</span></p>
                            {app.message && <p><strong>Message:</strong> {app.message}</p>}
                            <p className="text-sm text-gray-500">Submitted on: {new Date(app.created_at).toLocaleString()}</p>

                            <div className="mt-2 flex gap-4 text-blue-600 underline">
                                <a href={app.valid_id} target="_blank" rel="noopener noreferrer">View Valid ID</a>
                                {app.proof_of_income && (
                                    <a href={app.proof_of_income} target="_blank" rel="noopener noreferrer">View Proof of Income</a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'approved':
            return 'text-green-600';
        case 'disapproved':
            return 'text-red-600';
        default:
            return 'text-yellow-600';
    }
}
