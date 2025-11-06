"use client";
import { useParams, useSearchParams } from "next/navigation";
import LeaseDetails from "@/components/landlord/properties/unitDetails";

const ViewUnitTenantPage = () => {
  const { unitId } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");
  if (!unitId) {
    return <div>Error: Missing unit ID</div>;
  }

  return (
      <LeaseDetails unitId={unitId} />
  );

};

export default ViewUnitTenantPage;
