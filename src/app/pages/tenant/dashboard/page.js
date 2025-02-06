"use client";

import Link from "next/link";
import useAuth from "../../../../../hooks/useSession";
import ChatComponent from "../../../../components/modules/chat";
import {useRouter} from "next/navigation";
import {initializePusher} from "../../utils/pusher";
import {useEffect, useState} from "react";
export default function TenantDashboard() {
  const { user, loading, error, signOut } = useAuth();
const router = useRouter();
    initializePusher();
    const [userDetails, setUserDetails] = useState(null);


    async function fetchUserData(user_id) {
        try {
            const response = await fetch(`/api/user/details/${user_id}`);
            const data = await response.json();
            setUserDetails(data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    useEffect(() => {
        if (user?.user_id) {
            fetchUserData(user.user_id);
        }
    }, [user?.user_id]);

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
          {/*{userDetails && user.userType === "tenant" && `| Tenant ID: ${userDetails.tenant_id}`}*/}
          {/*{userDetails && user.userType === "landlord" && `| Landlord ID: ${userDetails.landlord_id}`}*/}

          {/* View Profile Button */}
          {/*<Link href={`/pages/${user.userType}/profile/${user.userID}`}>*/}
          {/*    <button className="bg-blue-500 text-white px-4 py-2 rounded-md">*/}
          {/*        View Profile*/}
          {/*    </button>*/}
          {/*</Link>*/}



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
