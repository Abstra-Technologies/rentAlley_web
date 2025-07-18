"use client";

import { useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import MaintenanceRequestList from "../../../../components/tenant/currentRent/currentMaintainance/maintenance";

export default function TenantMaintenance() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  console.log('maintenance home page id: ', agreementId);
  
  return (
    <TenantLayout agreement_id={agreementId}>
      <MaintenanceRequestList agreement_id={agreementId} user_id={user?.user_id} />
    </TenantLayout>
  );
}
