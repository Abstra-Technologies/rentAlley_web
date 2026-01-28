"use client";

import {
  Rocket,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  XCircle,
  X,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LandlordBetaBanner() {
  const { user } = useAuthStore();
  const [activating, setActivating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const statusKey = user?.user_id
    ? `/api/landlord/beta/status?user_id=${user.user_id}`
    : null;

  const { data, isLoading } = useSWR(statusKey, fetcher);

  const status = data?.status;
  const isActive = data?.is_active;

  // Check if banner was dismissed (only for active status)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = localStorage.getItem("beta_banner_dismissed");
      if (wasDismissed === "true") {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("beta_banner_dismissed", "true");
  };

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

  /* ================= DETERMINE STATE ================= */
  let currentState: "active" | "approved" | "pending" | "rejected" | "default";

  if (user && status === "approved" && isActive) {
    currentState = "active";
  } else if (user && status === "approved" && !isActive) {
    currentState = "approved";
  } else if (status === "pending") {
    currentState = "pending";
  } else if (status === "rejected") {
    currentState = "rejected";
  } else {
    currentState = "default";
  }

  // Don't show if active and dismissed
  if (currentState === "active" && dismissed) {
    return null;
  }

  /* ================= ACTIVE STATE - COMPACT STRIP ================= */
  if (currentState === "active") {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium truncate">
                <span className="font-semibold">Beta Access Active</span>
                <span className="hidden sm:inline text-white/90">
                  {" "}
                  — Enjoy discounted transaction fees
                </span>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= OTHER STATES - COMPACT CARD ================= */
  const configs = {
    approved: {
      gradient: "from-blue-500 to-indigo-500",
      icon: Zap,
      title: "Beta Access Approved! 🎊",
      description: "Activate to unlock discounted fees",
      actionLabel: "Activate Now",
      actionHandler: handleActivateBeta,
      actionLoading: activating,
    },
    pending: {
      gradient: "from-blue-500 to-cyan-500",
      icon: Clock,
      title: "Beta Review in Progress",
      description: "We'll notify you once approved",
      actionLabel: null,
      actionHandler: null,
      actionLoading: false,
    },
    rejected: {
      gradient: "from-gray-500 to-gray-600",
      icon: XCircle,
      title: "Beta Application Closed",
      description: "We'll reach out if access reopens",
      actionLabel: null,
      actionHandler: null,
      actionLoading: false,
    },
    default: {
      gradient: "from-blue-500 to-emerald-500",
      icon: Rocket,
      title: "Join the UpKyp Beta 🚀",
      description: "Get early access with exclusive benefits",
      actionLabel: "Apply Now",
      actionHandler: handleApplyBeta,
      actionLoading: applying,
    },
  };

  const config = configs[currentState];
  const Icon = config.icon;

  return (
    <div className="px-4 md:px-6 pt-4 md:pt-5">
      <div
        className={`max-w-7xl mx-auto rounded-xl bg-gradient-to-r ${config.gradient}
                    text-white shadow-md p-3 md:p-4`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon + Content */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold truncate">
                {config.title}
              </h3>
              <p className="text-xs md:text-sm text-white/80 truncate">
                {config.description}
              </p>
            </div>
          </div>

          {/* Right: Action Button */}
          {config.actionLabel && (
            <button
              onClick={config.actionHandler!}
              disabled={config.actionLoading}
              className={`flex-shrink-0 inline-flex items-center gap-1.5
                          text-xs md:text-sm font-bold
                          px-3 md:px-4 py-2 md:py-2.5 rounded-lg
                          transition-all duration-200
                          ${
                            config.actionLoading
                              ? "bg-white/20 cursor-not-allowed opacity-50"
                              : "bg-white text-gray-900 hover:bg-white/90 hover:scale-105 active:scale-95"
                          }`}
            >
              {config.actionLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  {config.actionLabel}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
