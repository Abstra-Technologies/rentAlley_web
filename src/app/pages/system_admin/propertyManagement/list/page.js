'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "../../../../../components/loadingScreen";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    
    const router = useRouter();
    
    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/properties/list");
                const data = await res.json();
                
                if (!data.properties.length) {
                    setError("No properties found.");
                } else {
                    setProperties(data.properties);
                }
            } catch (err) {
                setError("Failed to load properties.");
            }
            setLoading(false);
        }
        
        fetchProperties();
    }, []);
    
    // Sort function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    // Apply sorting and filtering
    const filteredAndSortedProperties = properties
        .filter(property => 
            property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (property.verification_status && property.verification_status.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            if (!sortConfig.key) return 0;
            
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    
    // Status badge component
    const StatusBadge = ({ status }) => {
        let badgeClass = "px-2 py-1 text-xs font-medium rounded-full ";
        
        switch(status) {
            case 'Verified':
                badgeClass += "bg-green-100 text-green-800";
                break;
            case 'Rejected':
                badgeClass += "bg-red-100 text-red-800";
                break;
            case 'In Review':
                badgeClass += "bg-blue-100 text-blue-800";
                break;
            default:
                badgeClass += "bg-gray-100 text-gray-800";
                break;
        }
        
        return <span className={badgeClass}>{status || 'Pending'}</span>;
    };
    
    if (loading) return <LoadingScreen />;
    
    return (
        <div className="bg-gray-50 min-h-screen flex">
            <SideNavAdmin/>
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-600">Property Listings</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage and view all property listings in your system.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="text"
                                placeholder="Search properties..."
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                ) : (
                    <div className="mt-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                    { key: 'property_id', label: 'ID' },
                                    { key: 'property_name', label: 'Name' },
                                    { key: 'city', label: 'City' },
                                    { key: 'verification_status', label: 'Status' },
                                    { key: 'actions', label: 'Actions' }
                                    ].map(column => (
                                    <th
                                        key={column.key}
                                        scope="col"
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => column.key !== 'actions' && requestSort(column.key)}
                                    >
                                        <div className="flex justify-center items-center space-x-1">
                                        <span>{column.label}</span>
                                        {sortConfig.key === column.key && (
                                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                        )}
                                        </div>
                                    </th>
                                    ))}
                                </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedProperties.length === 0 ? (
                                    <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No properties match your search criteria.
                                    </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedProperties.map((property) => (
                                    <tr key={property.property_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                        {property.property_id}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                        {property.property_name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                        {property.city}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                        <StatusBadge status={property.verification_status} />
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">
                                        <button
                                            onClick={() => router.push(`./details/${property.property_id}`)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Details
                                        </button>
                                        </td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
    
}