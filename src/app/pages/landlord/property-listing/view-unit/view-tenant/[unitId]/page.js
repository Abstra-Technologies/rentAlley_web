"use client";
import { useParams, useSearchParams } from "next/navigation";
import LeaseDetails from "../../../../../../../components/landlord/LeaseDetails";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";

const TenantPage = () => {
  const { unitId } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");

  if (!unitId) {
    return <div>Error: Missing unit ID</div>;
  }

  return (
    <LandlordLayout>
      <LeaseDetails unitId={unitId} tenantId={tenantId} />
    </LandlordLayout>
  );
};

export default TenantPage;
