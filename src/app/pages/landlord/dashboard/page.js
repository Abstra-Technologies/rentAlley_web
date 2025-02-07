"use client";

import useAuth from "../../../../../hooks/useSession";

export default function LandlordDashboard() {
  const { user, loading, error, signOut } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
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
          <p>Your user type is: {user.userType}</p>
          <p>Landlord ID: {user.landlord_id}</p>

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
