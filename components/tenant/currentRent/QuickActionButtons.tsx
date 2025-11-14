"use client";

import { CreditCard, ReceiptText, Bell, Wrench, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionButtonsProps {
  agreement_id: string;
}

export default function QuickActionButtons({ agreement_id }: QuickActionButtonsProps) {
  const router = useRouter();

  const actions = [
    {
      label: "Billing",
      icon: CreditCard,
      href: `/pages/tenant/rentalPortal/${agreement_id}/billing?agreement_id=${agreement_id}`,
    },
    {
      label: "Payments",
      icon: ReceiptText,
      href: `/pages/tenant/paymentHistory/currentLeasePayment?agreement_id=${agreement_id}`,
    },
    {
      label: "Updates",
      icon: Bell,
      href: `/pages/tenant/announcement?agreement_id=${agreement_id}`,
    },
    {
      label: "Maintenance",
      icon: Wrench,
      href: `/pages/tenant/maintenance?agreement_id=${agreement_id}`,
    },
  ];

  return (
    <div className="md:hidden w-full flex items-center justify-center gap-2 py-2">

      {actions.map(({ label, icon: Icon, href }) => (
        <div key={label} className="flex flex-col items-center">
          <button
            onClick={() => router.push(href)}
            className="
              w-10 h-10 rounded-full 
              flex items-center justify-center
              bg-white/0 border border-gray-300 
              shadow-sm
              hover:scale-105 active:scale-95 
              transition-all
            "
          >
            <Icon className="w-4 h-4 text-gray-700" />
          </button>
          <span className="text-[10px] text-gray-700 mt-1">{label}</span>
        </div>
      ))}

      {/* EXIT */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => router.push("/pages/tenant/my-unit")}
          className="
            w-10 h-10 rounded-full 
            flex items-center justify-center
            bg-white/0 border border-red-300 
            shadow-sm
            hover:scale-105 active:scale-95 
            transition-all
          "
        >
          <LogOut className="w-4 h-4 text-red-600" />
        </button>
        <span className="text-[10px] text-red-600 mt-1">Exit</span>
      </div>

    </div>
  );
}
