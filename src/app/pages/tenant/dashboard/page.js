"use client";
import { useRouter } from "next/navigation";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../components/loadingScreen";
import Announcements from "../../../../components/annoucemen/announcement";
import LeaseAgreementWidget from "../../../../components/tenant/LeaseAgreementWidget";
import TenantBillingTable from "../../../../components/tenant/TenantBillingTable";
import TenantPendingPaymentWidget from "../../../../components/tenant/PendingPaymentWidget";
import TenantPropertyChart from "../../../../components/analytics/tenantAnalytics";

export default function TenantDashboard() {
  const { user, admin, fetchSession, loading } = useAuthStore();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const [billingHistory, setBillingHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        await fetchSession();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user?.tenant_id]);

  useEffect(() => {
    if (!loading && !user && !admin) {
    }
  }, [user, admin, loading, router]);

  if (loading || dataLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <p>You need to log in to access the dashboard.</p>;
  }
  return (
    <TenantLayout>
      <div>
        <h1 className="text-3xl">
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>

        {/* Pending Payment Widget */}
        <TenantPendingPaymentWidget tenant_id={user?.tenant_id} />

        {/* Lease Agreement Widget */}
        <div className="mt-6">
          <LeaseAgreementWidget tenant_id={user?.tenant_id} />
        </div>

        {/* Billing Table */}
        <div className="mt-6">
          <TenantBillingTable tenant_id={user?.tenant_id} />
        </div>

        {/* Other Tenant Dashboard Components */}
        <div className="mt-6">
          <Announcements />
        </div>
        <div>
          <TenantPropertyChart />
        </div>
      </div>
    </TenantLayout>
  );
}
