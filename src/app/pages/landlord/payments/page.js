'use client'
import useAuth from "../../../../../hooks/useSession";
import PaymentList from "../../../../components/landlord/tenantPayments";

export default function PaymentsPage() {
    const {user} = useAuth();
    const landlord_id = user?.landlord_id;

    return (
        <div className="max-w-5xl mx-auto mt-8">
            <PaymentList landlordId={landlord_id} />
        </div>
    );
}
