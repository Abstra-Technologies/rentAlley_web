"use client";

import SideNavProfile from "../../../../../components/navigation/sidebar-profile";
import SecurityPage from "../../../../../components/securityPrivacy";

export default function userSecurityPrivacy() {
    return ( 
    <div className="flex flex-col md:flex-row min-h-screen">
          <SideNavProfile/>
        <div className="flex-grow">
          <SecurityPage/>
        </div>
      </div> 

    );
}