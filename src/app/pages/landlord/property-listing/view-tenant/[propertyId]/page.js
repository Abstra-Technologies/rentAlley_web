"use client";
import { useParams } from "next/navigation";
import LeaseDetails from "../../../../../../components/landlord/LeaseDetails";

export default function LeaseAgreements() {
  const propertyId = useParams().propertyId;

  return (
    <div className="p-6">
      <LeaseDetails propertyId={propertyId} unitId={""} />
    </div>
  );
}
