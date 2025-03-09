// "use client";
// import { useParams, useSearchParams } from "next/navigation";
// import LeaseDetails from "../../../../../../../components/landlord/LeaseDetails";

// const TenantPage = () => {
//   const { unitId } = useParams();
//   const searchParams = useSearchParams();
//   const tenantId = searchParams.get('tenant_id');

//   return <LeaseDetails unitId={unitId} tenantId={tenantId} />;
// };

// export default TenantPage;


"use client";
import { useParams, useSearchParams } from "next/navigation";
import LeaseDetails from "../../../../../../../components/landlord/LeaseDetails";

const TenantPage = () => {
  const { unitId } = useParams();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id');

   if (!unitId) {
    return <div>Error: Missing unit ID</div>;
  }
  
  return (
    <LeaseDetails unitId={unitId} tenantId={tenantId} />
  );
};

export default TenantPage;