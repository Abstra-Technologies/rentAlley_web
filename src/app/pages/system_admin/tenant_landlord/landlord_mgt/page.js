'use client'
import { useEffect, useState } from "react";
import useAuth from "../../../../../../hooks/useSession";
import { useRouter } from "next/navigation";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { Eye, Trash2 } from "lucide-react";
import LoadingScreen from "../../../../../components/loadingScreen";

export default function LandlordList() {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchLandlords = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/landlord/list");

                if (!response.ok) {
                    throw new Error('Failed to fetch landlords.');
                }
                const data = await response.json();
                setLandlords(data.landlords);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLandlords();
    }, []);

    if (error) return <p className="text-red-500 p-6">Error: {error}</p>;

    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {
        return <p className="text-red-500 p-6">You need to log in to access the dashboard.</p>;
    }

    return (
        <div className="flex">
            <SideNavAdmin />

            <div className="flex-1 p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">Landlords List</h1>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Landlord ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">User ID</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verified</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created At</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {landlords.length > 0 ? (
                                    landlords.map((landlord, index) => (
                                        <tr key={landlord.landlord_id} className="hover:bg-gray-50 border-b">
                                            <td className="px-6 py-4 text-blue-600">{index + 1}</td>
                                            <td className="px-6 py-4">{landlord.landlord_id}</td>
                                            <td className="px-6 py-4 text-blue-600 hover:underline cursor-pointer" 
                                                onClick={() => router.push(`./viewProfile/landlord/${landlord.user_id}`)}>
                                                {landlord.user_id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {landlord.is_verified ? 
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✅ Yes</span> : 
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">❌ No</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">{new Date(landlord.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            router.push(`./viewProfile/landlord/${landlord.user_id}`);
                                                        }}
                                                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(landlord.landlord_id)}
                                                        className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            <p>No landlords found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}