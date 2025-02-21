'use client'
import {useEffect, useState} from "react";
import useAuth from "../../../../../../hooks/useSession";
import {useRouter} from "next/navigation";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { Eye, Trash2 } from "lucide-react"

export default function  LandlordList() {
    const [landlords, setLandlords] = useState([]);
    const [landlordInfo, setlandlordInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAuth();
    const router = useRouter();
    useEffect(() => {
        const fetchLandlords = async () => {
            try {
                const response = await fetch("/api/landlord/list");

                if (!response.ok) {
                    new Error('Failed to fetch landlords.');
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

    if (loading) return <p>Loading landlords...</p>;
    if (error) return <p>Error: {error}</p>;

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!admin) {
        return <p>You need to log in to access the dashboard.</p>;
    }


    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <SideNavAdmin/>

            {/* Main Content */}
            <div className="flex-1 p-8 bg-white shadow-md">
                <h1 className="text-2xl font-bold text-blue-600 mb-6">Landlords List</h1>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b bg-white-200">
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">#</th>
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Landlord ID</th>
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">User ID</th>
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Profile Picture</th>
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Verified</th>
                                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-700">Created At</th>
                                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-700">Actions</th>
                                </tr>   
                            </thead>
                            <tbody>
                                {landlords.map((landlord, index) => (
                                    <tr key={landlord.landlord_id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-lg text-blue-600 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 text-lg text-gray-800">{landlord.landlord_id}</td>
                                        <td className="px-6 py-4 text-lg text-blue-600 underline cursor-pointer" 
                                            onClick={() => router.push(`./viewProfile/landlord/${landlord.user_id}`)}>
                                            {landlord.user_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <img src={landlordInfo?.profilePicture || "/default-avatar.png"} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                                        </td>
                                        <td className="px-6 py-4 text-lg">{landlord.verified ? "✅ Yes" : "❌ No"}</td>
                                        <td className="px-6 py-4 text-lg">{new Date(landlord.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-lg text-right">
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`./viewProfile/landlord/${landlord.user_id}`)}}
                          className="text-blue-400 hover:text-blue-800 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-6 h-6" />  
                        </button>
                        <button
                          onClick={() => handleDelete(landlord.landlord_id)}
                          className="text-red-400 hover:text-red-800 transition-colors"
                          title="Delete Tenant"
                        >
                          <Trash2 className="w-6 h-6" /> 
                        </button>
                      </div>
                    </td>
                                    </tr>
                                    
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};