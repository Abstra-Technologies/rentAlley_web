"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "../../../../../../../components/landlord/InterestedTenants";
import LoadingScreen from "../../../../../../../components/loadingScreen";
import useAuth from "../../../../../../../../hooks/useSession";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";

export default function TenantRequest() {
  const { unitId } = useParams();
  const [loading, setLoading] = useState(true);
  const [landlordId, setLandlordId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Get landlord ID from the authenticated user
    if (user) {
      setLandlordId(user.landlord_id); // Adjust this based on how your user object is structured
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LoadingScreen />;

  return (
    <LandlordLayout>
      <InterestedTenants unitId={unitId} landlordId={landlordId} />
    </LandlordLayout>
  );
}
