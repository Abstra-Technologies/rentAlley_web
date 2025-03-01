"use client";
import Announcements from "../../../../components/annoucemen/announcement";
import useAuth from "../../../../../hooks/useSession";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";

export default function TenantAnnouncements() {
  const { user } = useAuth();

  return (
    <TenantLayout>
      <Announcements userType={user?.userType} />
    </TenantLayout>
  );
}
