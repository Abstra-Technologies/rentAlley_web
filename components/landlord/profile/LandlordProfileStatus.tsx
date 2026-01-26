"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
  AlertCircle,
  Clock,
  XCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { CARD_BASE, GRADIENT_PRIMARY } from "@/constant/design-constants";

const fetcher = async (url: string) => {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    // If 400/404, assume incomplete status (no record exists yet)
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 400 || error.response?.status === 404)
    ) {
      return { status: "incomplete" };
    }
    throw error;
  }
};

type ProfileStatus = "incomplete" | "pending" | "rejected" | "verified";

interface Props {
  landlord_id: string;
}

interface ProfileStatusResponse {
  status?: ProfileStatus;
}

export default function LandlordProfileStatus({ landlord_id }: Props) {
  const router = useRouter();

  const { data, error, isLoading } = useSWR<ProfileStatusResponse>(
    landlord_id ? `/api/landlord/${landlord_id}/profileStatus` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      shouldRetryOnError: false, // Don't retry on 400/404 errors
      onError: (err) => {
        // Silently handle 400/404 errors (no profile status exists yet)
        if (
          !axios.isAxiosError(err) ||
          (err.response?.status !== 400 && err.response?.status !== 404)
        ) {
          console.error("Profile status error:", err);
        }
      },
    },
  );

  const status: ProfileStatus = data?.status ?? "incomplete";

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className={`${CARD_BASE} p-4 animate-pulse`}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    console.error("Profile status error:", error);
  }

  /* ================= VERIFIED (Show Nothing - Success State) ================= */
  if (status === "verified") {
    return null;
  }

  /* ================= STATUS CONFIGS ================= */
  const configs = {
    incomplete: {
      bg: "bg-gradient-to-r from-orange-50 to-amber-50",
      border: "border-orange-200",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      icon: AlertCircle,
      title: "Verification Required",
      titleColor: "text-orange-900",
      description:
        "Complete your verification to unlock all platform features and start managing properties.",
      descColor: "text-orange-700",
      button: true,
      buttonText: "Start Verification",
      buttonAction: () => router.push("/pages/landlord/verification"),
    },
    pending: {
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: Clock,
      title: "Verification Under Review",
      titleColor: "text-blue-900",
      description:
        "Your documents are being reviewed. You'll be notified once the verification is complete.",
      descColor: "text-blue-700",
      button: false,
    },
    rejected: {
      bg: "bg-gradient-to-r from-red-50 to-rose-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: XCircle,
      title: "Verification Needs Attention",
      titleColor: "text-red-900",
      description:
        "Some documents require correction. Please review the feedback and resubmit.",
      descColor: "text-red-700",
      button: true,
      buttonText: "Review & Resubmit",
      buttonAction: () => router.push("/pages/landlord/verification"),
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={`${CARD_BASE} ${config.bg} ${config.border} p-4 shadow-md hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={`${config.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner`}
        >
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm md:text-base font-bold ${config.titleColor} mb-1`}
          >
            {config.title}
          </h3>
          <p
            className={`text-xs md:text-sm ${config.descColor} leading-relaxed`}
          >
            {config.description}
          </p>

          {/* Action Button */}
          {config.button && (
            <button
              onClick={config.buttonAction}
              className={`mt-3 inline-flex items-center gap-2 
                                ${GRADIENT_PRIMARY} text-white
                                px-4 py-2 rounded-lg
                                text-sm font-semibold
                                shadow-md hover:shadow-lg
                                transition-all duration-300
                                hover:scale-105 active:scale-95`}
            >
              {config.buttonText}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
