"use client";
import useAuth from "../../../../../hooks/useSession";
import {useRouter} from "next/navigation";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";
import useAuthStore from "../../../../zustand/authStore";
import {useEffect, useState} from "react";
import LoadingScreen from "../../../../components/loadingScreen";

export default function TenantDashboard() {
  // const { user,loading, error, signOut } = useAuth();
  // const { user } = useAuthStore();
    const { user, admin, fetchSession, loading } = useAuthStore();
    const [dataLoading, setDataLoading] = useState(true);
    const router = useRouter();

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
    }, []);

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
  console.log("User Data ", user);
  return (
      <TenantLayout>
      <div>
          <h1>
              Welcome, {user.firstName} {user.lastName}!
          </h1>
          <p>Your user type is: {user.userType} | ID: {user?.user_id}</p>
          <p>Tenant ID: {user.tenant_id}</p>

          {/*<ChatComponent user={user}/>*/}
          {/*<button*/}
          {/*    onClick={() => router.push("/pages/commons/bug-report")}*/}
          {/*    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"*/}
          {/*>*/}
          {/*    Report a Bug*/}
          {/*</button>*/}

      </div>
      </TenantLayout>
  );
}
