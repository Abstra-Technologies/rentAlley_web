"use client";
import { useParams } from "next/navigation";
import LeaseDetails from "../../../../../../../components/landlord/LeaseDetails";

const TenantPage = () => {
  const { unitId } = useParams();

  return <LeaseDetails unitId={unitId} />;
};

export default TenantPage;
