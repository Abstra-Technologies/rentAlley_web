"use client";
import useAuth from "../../../../hooks/useSession";
import PaymentList from "../../../../components/landlord/tenantPayments";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

export default function PaymentsPage() {
  const { user } = useAuth();
  const landlord_id = user?.landlord_id;

  return (
    <LandlordLayout>
      <div className="max-w-5xl mx-auto mt-8">
        <PaymentList landlord_id={landlord_id} />
      </div>
    </LandlordLayout>
  );
}
