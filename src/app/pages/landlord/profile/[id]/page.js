"use client";

import { useParams } from "next/navigation";
import ProfilePage from "../../../../../components/profilePage"; 
import { useState, useEffect } from "react";
import axios from "axios";
import SideNavProfile from "../../../../../components/navigation/sidebar-profile";

export default function LandlordProfile() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <SideNavProfile />
      <div className="flex-grow">
        <ProfilePage />
      </div>
    </div>
  );
}
