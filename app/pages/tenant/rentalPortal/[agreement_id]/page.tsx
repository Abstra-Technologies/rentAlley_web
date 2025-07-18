
"use client";
import { useRouter, useParams  } from "next/navigation";
import TenantLayout from "../../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../../zustand/authStore";
import { useEffect, useState } from "react";
import LoadingScreen from "../../../../../components/loadingScreen";
import Announcements from "../../../../../components/annoucemen/announcement";
import LeaseAgreementWidget from "../../../../../components/tenant/analytics-insights/LeaseAgreementWidget";
import TenantBillingTable from "../../../../../components/tenant/TenantBillingTable";
import TenantPendingPaymentWidget from "../../../../../components/tenant/PendingPaymentWidget";
import TenantPropertyChart from "../../../../../components/analytics/tenantAnalytics";
import axios from "axios";



export default function RentPortalPage() {
  const { user, fetchSession, loading } = useAuthStore();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const [unitInfo, setUnitInfo] = useState<{ unit_name: string; property_name: string } | null>(null);
  const agreementId = params?.agreement_id;


 useEffect(() => {
    const fetchUnitName = async () => {
      try {
        const response = await axios.get(`/api/tenant/activeRent/unitInfo?agreement_id=${agreementId}`);
        setUnitInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch unit name:", error);
      }
    };

    if (agreementId) fetchUnitName();
  }, [agreementId]);

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        await fetchSession();
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user?.tenantId]);

//   if (loading || dataLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <div className="p-6">
        <p>You need to be logged in to access the Rent Portal.</p>
      </div>
    );
  }

  return (
<TenantLayout agreement_id={agreementId}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">Rental Portal</h1>
          <p className="mt-2 text-lg">
            Property: <span className="font-semibold">{unitInfo?.property_name}</span>
          </p>
          <p className="text-lg">
            Unit: <span className="font-semibold">{unitInfo?.unit_name}</span>
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Welcome, {user?.firstName} {user?.lastName}! Here you can manage all your rent-related activity.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <TenantPendingPaymentWidget tenant_id={tenantId || user?.tenant_id} /> */}
            <LeaseAgreementWidget agreement_id={agreementId} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* <TenantBillingTable tenant_id={tenantId || user?.tenant_id} />
          <Announcements user_id={user?.user_id} /> */}
        </div>

        <div className="mt-6">
          {/* <TenantPropertyChart /> */}
        </div>
      </div>
    </TenantLayout>
  );
}