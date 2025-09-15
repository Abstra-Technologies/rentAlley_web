'use client'
import dynamic from "next/dynamic";
const TenantOccupationChart = dynamic(() => import("../../../../../components/landlord/analytics/tenantOccupation"), { ssr: false });
import ActiveListingsCard from "@/components/landlord/analytics/activeListings";
import PendingListingsCard from "@/components/landlord/analytics/getPendingListings";
import LandlordLayout from "@/components/navigation/sidebar-landlord";
import useAuthStore from "@/zustand/authStore";
import { useEffect, useState } from "react";
import PropertyUtilitiesChart from "@/components/landlord/analytics/propertyUtilityRates";
import MaintenanceCategoriesChart from "@/components/landlord/analytics/getMaintenanceCategory";
import PaymentsPerMonthChart from "@/components/landlord/analytics/MonthlyPaymentsChart";
import ScoreCard from "@/components/landlord/analytics/scoreCards";

export default function PropertyPerformancePage() {
    const { user, admin, loading, fetchSession } = useAuthStore();
    const [totalTenants, setTotalTenants] = useState(0);
    const [totalRequests, setTotalRequests] = useState(0);

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    useEffect(() => {

        fetch(
            `/api/analytics/landlord/getTotalTenants?landlord_id=${user?.landlord_id}`
        )
            .then((res) => res.json())
            .then((data) => {
                console.log("Total Tenants:", data?.total_tenants);
                setTotalTenants(data.total_tenants);
            })
            .catch((error) => console.error("Error fetching total tenants:", error));

        fetch(
            `/api/analytics/landlord/getNumberofTotalMaintenance?landlord_id=${user?.landlord_id}`
        )
            .then((res) => res.json())
            .then((data) => {
                console.log("Total Maintenance Requests:", data?.total_requests);
                setTotalRequests(data?.total_requests);
            })
            .catch((error) =>
                console.error("Error fetching maintenance request count:", error)
            );


    });


    return (
        <LandlordLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="gradient-header font-bold text-gray-900">
                        Property Performance Analytics
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Get insights into your properties, tenants, and financial performance.
                    </p>
                </header>

                {/* KPI Summary Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
                    <ActiveListingsCard landlordId={user?.landlord_id} />
                    <PendingListingsCard landlordId={user?.landlord_id} />
                    <ScoreCard
                        title="Total Active Tenants"
                        value={totalTenants}
                        borderColor="green"
                    />
                    <ScoreCard
                        title="Pending Maintenance Request"
                        value={totalRequests}
                        borderColor="red"
                    />
                </div>

                {/* Tenant Insights */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Tenant Insights
                    </h2>
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                        <TenantOccupationChart landlordId={user?.landlord_id} />
                    </div>
                </section>

                {/* Property Insights */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Property Insights
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                            <PropertyUtilitiesChart landlordId={user?.landlord_id} />
                        </div>
                        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                            <MaintenanceCategoriesChart landlordId={user?.landlord_id} />
                        </div>
                    </div>
                </section>

                {/* Financial Insights */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Financial Insights
                    </h2>
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                        <PaymentsPerMonthChart landlordId={user?.landlord_id} />
                    </div>
                </section>
            </div>
        </LandlordLayout>
    );


}
