"use client";

import {
  Rocket,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  XCircle,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { GRADIENT_PRIMARY } from "@/constant/design-constants";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LandlordBetaBanner() {
  const { user } = useAuthStore();
  const [activating, setActivating] = useState(false);
  const [applying, setApplying] = useState(false);

  const statusKey = user?.user_id
    ? `/api/landlord/beta/status?user_id=${user.user_id}`
    : null;

  const { data, isLoading } = useSWR(statusKey, fetcher);

  const status = data?.status;
  const isActive = data?.is_active;

  /* ================= ACTIVATE ================= */
  const handleActivateBeta = async () => {
    if (!user) return;

    try {
      setActivating(true);

      await axios.post("/api/landlord/beta/activate", {
        user_id: user.user_id,
      });

      await mutate(statusKey);

      await Swal.fire({
        icon: "success",
        title: "Beta Activated 🎉",
        text: "Your beta access is now active.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Activation Failed",
        text:
          err?.response?.data?.error ||
          "Unable to activate beta. Please try again.",
      });
    } finally {
      setActivating(false);
    }
  };

  /* ================= APPLY ================= */
  const handleApplyBeta = async () => {
    if (!user) return;

    try {
      setApplying(true);

      await axios.post("/api/landlord/beta/apply");

      await mutate(statusKey);

      await Swal.fire({
        icon: "success",
        title: "Application Sent",
        text: "Your beta request has been submitted for review.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Request Failed",
        text: err?.response?.data?.error || "Unable to submit beta request.",
      });
    } finally {
      setApplying(false);
    }
  };

  /* ================= LOADING ================= */
  if (isLoading) return null;

  /* ================= STATUS CONFIGS ================= */
  const configs = {
    active: {
      gradient: "from-emerald-500 via-green-500 to-emerald-600",
      icon: CheckCircle,
      iconBg: "bg-white/20",
      title: "Beta Access Active 🎉",
      description:
        "You're enjoying full platform access with exclusive discounted transaction fees.",
      showAction: false,
    },
    approved: {
      gradient: "from-blue-500 via-indigo-500 to-purple-600",
      icon: Zap,
      iconBg: "bg-white/20",
      title: "Beta Access Approved 🎊",
      description:
        "Activate whenever you're ready — no automatic charges, full control.",
      showAction: true,
      actionLabel: "Activate Beta Now",
      actionHandler: handleActivateBeta,
      actionLoading: activating,
    },
    pending: {
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      icon: Clock,
      iconBg: "bg-white/20",
      title: "Beta Review in Progress ⏳",
      description:
        "Your application is under review. We'll notify you once approved.",
      showAction: false,
    },
    rejected: {
      gradient: "from-gray-600 via-gray-700 to-slate-700",
      icon: XCircle,
      iconBg: "bg-white/20",
      title: "Beta Application Closed",
      description:
        "Thank you for your interest. We'll reach out if beta access reopens.",
      showAction: false,
    },
    default: {
      gradient: "from-blue-500 via-emerald-500 to-cyan-500",
      icon: Rocket,
      iconBg: "bg-white/20",
      title: "Join the UpKyp Beta 🚀",
      description:
        "Get early access with exclusive benefits, discounted fees, and priority support.",
      showAction: true,
      actionLabel: "Apply for Beta",
      actionHandler: handleApplyBeta,
      actionLoading: applying,
    },
  };

  /* ================= DETERMINE CONFIG ================= */
  let config;
  if (user && status === "approved" && isActive) {
    config = configs.active;
  } else if (user && status === "approved" && !isActive) {
    config = configs.approved;
  } else if (status === "pending") {
    config = configs.pending;
  } else if (status === "rejected") {
    config = configs.rejected;
  } else {
    config = configs.default;
  }

  const Icon = config.icon;

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-6">
      <div
        className={`max-w-7xl mx-auto rounded-2xl border border-white/20
                    bg-gradient-to-r ${config.gradient}
                    text-white shadow-lg hover:shadow-xl
                    transition-all duration-300
                    p-4 md:p-6`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon + Content */}
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`${config.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold mb-1">
                {config.title}
              </h3>
              <p className="text-sm md:text-base text-white/90 leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {config.showAction && (
            <button
              onClick={config.actionHandler}
              disabled={config.actionLoading}
              className={`flex-shrink-0 w-full md:w-auto
                                inline-flex items-center justify-center gap-2
                                text-sm md:text-base font-bold
                                px-5 py-3 rounded-xl
                                transition-all duration-300
                                shadow-lg hover:shadow-xl
                                ${
                                  config.actionLoading
                                    ? "bg-white/20 cursor-not-allowed opacity-50"
                                    : "bg-white/90 hover:bg-white text-gray-900 hover:scale-105 active:scale-95"
                                }`}
            >
              {config.actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {config.actionLabel}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
