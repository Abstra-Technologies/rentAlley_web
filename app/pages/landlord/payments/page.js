"use client";
import useAuthStore from "../../../../zustand/authStore";
import PaymentList from "../../../../components/landlord/tenantPayments";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import PaymentReviewWidget from "../../../../components/landlord/widgets/PaymentReviewWidget";
import PageTitle from '../../../../components/page_layouts/pageTitle';
import { PaidDepositsWidget }from "../../../../components/landlord/widgets/secAdvanceWidgets";
import {useEffect} from "react";


export default function PaymentsPage() {
    const { user, admin, loading, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user]);

    const landlord_id = user?.landlord_id;

    return (
        <LandlordLayout>
            <div className="px-4 lg:px-8 py-8 space-y-8">
                {/* Page Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="gradient-header">
                        Property Payments
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 sm:mt-0">
                        Track tenant payments, deposits, and pending reviews
                    </p>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tenant Payments Ledger - spans 2/3 */}
                    <section className="bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80 rounded-2xl shadow-lg p-6 hover:shadow-xl transition lg:col-span-2">
                        <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                            Tenant Payments Ledger
                        </h2>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 h-[600px] flex flex-col">
                            <PaymentList landlord_id={landlord_id} />
                        </div>
                    </section>



                    {/* Payment Review - spans 1/3 */}
                    <section className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition lg:col-span-1">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                            🕒 Pending Payment Review
                        </h2>
                        <div className="overflow-x-auto">
                            <PaymentReviewWidget />
                        </div>
                    </section>
                </div>


                {/* Security Deposits */}
                <section className="bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                    <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                        💰 Security Deposits & Advance Payments
                    </h2>
                    <div className="overflow-x-auto">
                        <PaidDepositsWidget landlord_id={user?.landlord_id} />
                    </div>
                </section>
            </div>
        </LandlordLayout>
    );
}
