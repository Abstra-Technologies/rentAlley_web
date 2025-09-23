"use client";

import { Suspense } from "react";
import useAuthStore from "../../../../zustand/authStore";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import MyApplications from "../../../../components/tenant/myApplication/MyApplications";
import { useEffect, useState } from "react";
import TenantOutsidePortalNav from "@/components/navigation/TenantOutsidePortalNav";

function TenantMyApplicationsContent() {
  const { fetchSession, user, admin } = useAuthStore();
  const tenantId = user?.tenant_id;

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user]);

  if (!tenantId) return <p>No tenant information available.</p>;

  return <MyApplications tenantId={tenantId} />;
}

export default function TenantMyApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading My Applications...</div>}>
      <div className="flex min-h-screen bg-gray-50">
        <TenantOutsidePortalNav />

        <div className="flex-1 md:ml-64">
          <div className="p-6">
            <TenantMyApplicationsContent />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
