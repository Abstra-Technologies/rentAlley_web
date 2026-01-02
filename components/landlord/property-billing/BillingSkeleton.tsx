"use client";

export default function BillingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
            <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
                {/* Header Skeleton */}
                <div className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-7 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
                            </div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
                        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 mt-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="p-4 bg-white rounded-xl shadow border border-gray-200"
                            >
                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse mb-2" />
                                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Rate Status Skeleton */}
                    <div className="rounded-lg border-l-4 border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-64 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards Skeleton */}
                <div className="block md:hidden space-y-3 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1" />
                                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
                            </div>

                            <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                                <div className="flex justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                </div>
                            </div>

                            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Desktop Table Skeleton */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="h-8 bg-gray-200 rounded-lg w-24 mx-auto animate-pulse" />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
