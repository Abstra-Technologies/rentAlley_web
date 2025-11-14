"use client";

import ProfilePage from "@/components/Commons/profilePage";
import SideNavProfile from "@/components/navigation/sidebar-profile";

export default function LandlordProfile() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <SideNavProfile />

      {/* Main Content */}
      <main className="flex-1 md:ml-72">
        <ProfilePage />
      </main>
    </div>
  );
}