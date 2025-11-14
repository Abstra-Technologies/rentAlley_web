"use client";

import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import { FaHome, FaSearch } from "react-icons/fa";
import { MegaphoneIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";


export default function MobileFeedsPage({ user }) {
      const router = useRouter();

  return (
    <div className="block lg:hidden w-full px-4 py-4">

      {/* MOBILE MAX WIDTH WRAPPER */}
      <div className="w-full max-w-[420px] mx-auto">

        {/* PAYABLES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <TenantPayables tenant_id={user?.tenant_id} />
        </div>

        {/* QUICK ACTIONS (Mobile Only) */}
       {/* QUICK ACTIONS — Compact Mobile Buttons */}
<div className="mt-3 flex items-center justify-between gap-2">

  {/* My Units */}
  <button
    onClick={() => router.push("/pages/tenant/my-units")}
    className="
      flex flex-col items-center justify-center
      w-14 h-14 rounded-full
      bg-white border border-gray-300
      shadow-sm active:scale-95 transition-all
    "
  >
    <FaHome className="w-4 h-4 text-gray-700 mb-0.5" />
    <span className="text-[9px] font-medium text-gray-700">Units</span>
  </button>

  {/* Find Rent */}
  <button
    onClick={() => router.push("/pages/find-rent")}
    className="
      flex flex-col items-center justify-center
      w-14 h-14 rounded-full
      bg-white border border-gray-300
      shadow-sm active:scale-95 transition-all
    "
  >
    <FaSearch className="w-4 h-4 text-gray-700 mb-0.5" />
    <span className="text-[9px] font-medium text-gray-700">Find</span>
  </button>

  {/* Maintenance */}
  <button
    onClick={() => router.push("/pages/tenant/maintenance")}
    className="
      flex flex-col items-center justify-center
      w-14 h-14 rounded-full
      bg-white border border-gray-300
      shadow-sm active:scale-95 transition-all
    "
  >
    <WrenchScrewdriverIcon className="w-4 h-4 text-gray-700 mb-0.5" />
    <span className="text-[9px] font-medium text-gray-700">Repair</span>
  </button>

  {/* Updates */}
  <button
    onClick={() => router.push("/pages/tenant/announcements")}
    className="
      flex flex-col items-center justify-center
      w-14 h-14 rounded-full
      bg-white border border-gray-300
      shadow-sm active:scale-95 transition-all
    "
  >
    <MegaphoneIcon className="w-4 h-4 text-gray-700 mb-0.5" />
    <span className="text-[9px] font-medium text-gray-700">Updates</span>
  </button>

</div>


        {/* Optional: put announcements + maintenance here if needed */}
        
        <div className="mt-4">
          <AnnouncementFeeds tenant_id={user?.tenant_id} />
        </div>
       

      </div>

    </div>
  );
}
