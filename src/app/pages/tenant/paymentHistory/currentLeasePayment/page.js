'use client'
import TenantLeasePayments from "../../../../../components/tenant/currentLeasePaymentHistory";
import useAuth from "../../../../../../hooks/useSession";

export default function TenantPaymentsPage() {
    const {user} = useAuth();
    const tenant_id = user?.tenant_id;


    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Payments</h1>
            <p>Tenant id: {tenant_id}</p>
            <TenantLeasePayments tenant_id={tenant_id} />
        </div>
    );
}
