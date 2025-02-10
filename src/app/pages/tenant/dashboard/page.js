"use client";
import useAuth from "../../../../../hooks/useSession";
import ChatComponent from "../../../../components/modules/chat";
import {useRouter} from "next/navigation";
import ProfilePage from "../../../../components/profilePage";
export default function TenantDashboard() {
  const { user, loading, error, signOut } = useAuth();
const router = useRouter();
    if (loading) {
    return <p>Loading...</p>;
  }
  if (!user) {
    return <p>You need to log in to access the dashboard.</p>;
  }
  console.log("User Data ", user);
  return (
      <div>
          <h1>
              Welcome, {user.firstName} {user.lastName}!
          </h1>
          <p>Your user type is: {user.userType} | ID: {user.user_id}</p>
          <p>Tenant ID: {user.tenant_id}</p>


          <ChatComponent user={user}/>

          <button
              onClick={() => router.push("/pages/commons/bug-report")}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
          >
              Report a Bug
          </button>

          {/* Sign Out Button */}
          <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded-md ml-4"
          >
              Sign Out
          </button>

          {/* Additional content can go here */}
      </div>
  );
}
