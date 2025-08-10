"use client";
import useAuth from "../../../../hooks/useSession";
import PaymentList from "../../../../components/landlord/tenantPayments";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import PaymentReviewWidget from "../../../../components/landlord/widgets/PaymentReviewWidget";
import PageTitle from '../../../../components/page_layouts/pageTitle';


export default function PaymentsPage() {
    const { user } = useAuth();
    const landlord_id = user?.landlord_id;

    return (
        <LandlordLayout>
            <div className="px-4 lg:px-6 py-6">
                <PageTitle>Property Payments</PageTitle>

                {/* Dashboard Flex Layout */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Side: Tenant Payments */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl shadow p-4 h-full">
                            <h2 className="text-lg font-bold mb-4">Tenant Payments History</h2>
                            <div className="overflow-x-auto">
                                <PaymentList landlord_id={landlord_id} />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Payment Review */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl shadow p-4 h-full">
                            <h2 className="text-lg font-bold mb-4">Payment Pending Review</h2>
                            <div className="overflow-x-auto">
                                <PaymentReviewWidget />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </LandlordLayout>


    );
}
