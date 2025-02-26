"use client";
import { useParams } from "next/navigation";
import InterestedTenants from "../../../../../../../components/landlord/InterestedTenants";

export default function TenantRequest() {
  const { unitId } = useParams();

  return <InterestedTenants unitId={unitId} />;
}
