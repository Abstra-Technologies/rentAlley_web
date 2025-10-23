"use client";

import ProfilePage from "@/components/Commons/profilePage";
import SideNavProfile from "@/components/navigation/sidebar-profile";

export default function LandlordProfile() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <div className="md:w-64">
        <SideNavProfile />
      </div>
      <div className="flex-grow p-4 md:pl-6">
        <section className="bg-white rounded-xl shadow-lg p-6">
          <ProfilePage />
        </section>
      </div>
    </div>
  );
}
