"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
    PlusCircleIcon,
    WrenchIcon,
    BuildingOffice2Icon,
    HomeIcon,
    EyeIcon,
    TrashIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import { BackButton } from "@/components/navigation/backButton";
import { formatDate } from "@/utils/formatter/formatters";
import Pagination from "@/components/Commons/Pagination";
import AddAssetModal from "@/components/landlord/properties/AddAssetModal";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const AssetsManagementPage = () => {
    const { id } = useParams(); // property_id
    const router = useRouter();
    const property_id = id as string;
    const [showAddModal, setShowAddModal] = useState(false);

    const [activeFilter, setActiveFilter] = useState<"all" | "property" | "unit">("all");
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const {
        data: assets,
        isLoading,
        error,
    } = useSWR(property_id ? `/api/landlord/properties/assets?property_id=${property_id}` : null, fetcher);

    const { data: propertyDetails } = useSWR(
        property_id ? `/api/propertyListing/getPropDetailsById?property_id=${property_id}` : null,
        fetcher
    );

    //  Fetch all units for this property
    const { data: units, isLoading: loadingUnits } = useSWR(
        property_id ? `/api/unitListing/getUnitListings?property_id=${property_id}` : null,
        fetcher
    );


    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteAsset = async (asset_id: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the asset.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`/api/landlord/assets?asset_id=${asset_id}`);
            Swal.fire("Deleted!", "Asset has been deleted.", "success");
            mutate(`/api/landlord/assets?property_id=${property_id}`);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to delete asset.", "error");
        }
    };

    const filteredAssets =
        assets?.filter((a: any) => {
            if (activeFilter === "property") return !a.unit_id;
            if (activeFilter === "unit") return a.unit_id;
            return true;
        }) || [];

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

    if (error)
        return (
                <div className="p-6">
                    <p className="text-red-600 text-center">Failed to load assets.</p>
                </div>
        );

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
                {/* Header */}
                <BackButton label="Back to Property" />

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-2.5 rounded-xl shadow-md">
                            <WrenchIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Asset Management — {propertyDetails?.property?.property_name || "Property"}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Track, maintain, and manage all assets for this property.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg active:scale-95 transition-all"
                        >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Add Asset
                        </button>


                        <div className="flex gap-2 ml-auto">
                            {["all", "property", "unit"].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter as any)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                                        activeFilter === filter
                                            ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent"
                                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {filter === "all"
                                        ? "All"
                                        : filter === "property"
                                            ? "Property-Level"
                                            : "Unit-Level"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Asset</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Assigned To</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Model</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Warranty</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-6 text-gray-500">
                                        Loading assets...
                                    </td>
                                </tr>
                            ) : paginatedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-6 text-gray-500">
                                        No assets found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAssets.map((asset: any) => (
                                    <tr key={asset.asset_id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-3 font-medium text-gray-800">{asset.asset_name}</td>
                                        <td className="px-6 py-3 text-gray-600">{asset.category || "—"}</td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {asset.unit_name ? (
                                                <span className="inline-flex items-center gap-1 text-blue-600">
                            <HomeIcon className="w-4 h-4" /> {asset.unit_name}
                          </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-500">
                            <BuildingOffice2Icon className="w-4 h-4" /> Property
                          </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{asset.model || "—"}</td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {asset.warranty_expiry ? formatDate(asset.warranty_expiry) : "—"}
                                        </td>
                                        <td className="px-6 py-3">
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                asset.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : asset.status === "under_maintenance"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {asset.status}
                        </span>
                                        </td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${property_id}/assets/${asset.asset_id}`
                                                    )
                                                }
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${property_id}/assets_management/${asset.asset_id}/edit`
                                                    )
                                                }
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAsset(asset.asset_id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {filteredAssets.length > itemsPerPage && (
                        <Pagination
                            currentPage={page}
                            totalPages={Math.ceil(filteredAssets.length / itemsPerPage)}
                            totalItems={filteredAssets.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>

            <AddAssetModal
                propertyId={property_id}
                units={units}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => mutate(`/api/landlord/assets?property_id=${property_id}`)}
            />

        </>
    );
};

export default AssetsManagementPage;
