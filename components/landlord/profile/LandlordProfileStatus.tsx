"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    AlertCircle,
    Clock,
    XCircle,
    ArrowRight,
} from "lucide-react";
import { CARD_BASE, GRADIENT_PRIMARY } from "@/constant/design-constants";

const fetcher = async (url: string) => {
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
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

    const { data, isLoading } = useSWR<ProfileStatusResponse>(
        landlord_id ? `/api/landlord/${landlord_id}/profileStatus` : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60_000 }
    );

    const status: ProfileStatus = data?.status ?? "incomplete";

    /* ================= LOADING ================= */
    if (isLoading) {
        return (
            <div className={`${CARD_BASE} p-3 animate-pulse`}>
                <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-36" />
                        <div className="h-2.5 bg-gray-100 rounded w-full" />
                    </div>
                </div>
            </div>
        );
    }

    /* ================= VERIFIED ================= */
    if (status === "verified") return null;

    /* ================= CONFIG ================= */
    const configs = {
        incomplete: {
            bg: "bg-gradient-to-r from-orange-50 to-amber-50",
            border: "border-orange-200",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            icon: AlertCircle,
            title: "Verification Required",
            desc:
                "Complete verification to unlock all features.",
            action: "Start Verification",
        },
        pending: {
            bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
            border: "border-blue-200",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            icon: Clock,
            title: "Verification Under Review",
            desc:
                "Your documents are currently being reviewed.",
        },
        rejected: {
            bg: "bg-gradient-to-r from-red-50 to-rose-50",
            border: "border-red-200",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            icon: XCircle,
            title: "Verification Needs Attention",
            desc:
                "Please review feedback and resubmit documents.",
            action: "Review & Resubmit",
        },
    };

    const cfg = configs[status];
    const Icon = cfg.icon;

    return (
        <div
            className={`${CARD_BASE} ${cfg.bg} ${cfg.border}
    px-3 py-2 flex items-center gap-3`}
        >
            {/* Icon */}
            <div
                className={`${cfg.iconBg} w-8 h-8 rounded-md
      flex items-center justify-center flex-shrink-0`}
            >
                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
            </div>

            {/* Text */}
            <p className="text-xs text-gray-700 flex-1 truncate">
                <span className="font-semibold">{cfg.title}:</span>{" "}
                {cfg.desc}
            </p>

            {/* Button */}
            {cfg.action && (
                <button
                    onClick={() => router.push("/pages/landlord/verification")}
                    className={`${GRADIENT_PRIMARY}
        text-white text-xs font-semibold
        px-3 py-1.5 rounded-md
        flex items-center gap-1
        whitespace-nowrap`}
                >
                    {cfg.action}
                    <ArrowRight className="w-3 h-3" />
                </button>
            )}
        </div>
    );

}
