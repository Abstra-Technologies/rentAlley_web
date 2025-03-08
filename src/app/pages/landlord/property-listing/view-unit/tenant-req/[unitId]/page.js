// "use client";
// import { useParams } from "next/navigation";
// import InterestedTenants from "../../../../../../../components/landlord/InterestedTenants";

// export default function TenantRequest() {
//   const { unitId } = useParams();

//   return <InterestedTenants unitId={unitId} />;
// }

"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import InterestedTenants from "../../../../../../../components/landlord/InterestedTenants";
import LoadingScreen from "../../../../../../../components/loadingScreen";
import  useAuth  from "../../../../../../../../hooks/useSession"; // Assuming you have an auth context

export default function TenantRequest() {
  const { unitId } = useParams();
  const [loading, setLoading] = useState(true);
  const [landlordId, setLandlordId] = useState(null);
  const { user } = useAuth(); // Assuming you have an auth context that provides the user

  useEffect(() => {
    // Get landlord ID from the authenticated user
    if (user) {
      setLandlordId(user.landlord_id); // Adjust this based on how your user object is structured
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LoadingScreen />;

  return <InterestedTenants unitId={unitId} landlordId={landlordId} />;
}