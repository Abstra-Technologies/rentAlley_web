"use client";
import Announcements from "../../../../components/annoucemen/announcementList";
import useAuth from "../../../../hooks/useSession";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";

export default function TenantAnnouncements() {
  const { user } = useAuth();

  return (
    <TenantLayout>
      <Announcements user_id={user?.user_id} />
    </TenantLayout>
  );
}
