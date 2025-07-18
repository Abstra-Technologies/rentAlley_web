"use client";
import { useSearchParams } from "next/navigation";
import useAuth from "../../../../hooks/useSession";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import Announcements from "../../../../components/annoucemen/announcementList";

export default function TenantAnnouncements() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const agreementId = searchParams.get("agreement_id");

  return (
    <TenantLayout agreement_id={agreementId}>
      <Announcements user_id={user?.user_id} agreement_id={agreementId} />
    </TenantLayout>
  );
}
