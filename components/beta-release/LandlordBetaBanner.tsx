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
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LandlordBetaBanner() {
    const { user } = useAuthStore();
    const router = useRouter();

    const [activating, setActivating] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const statusKey = user?.user_id
        ? `/api/landlord/beta/status?user_id=${user.user_id}`
        : null;

    const { data, isLoading } = useSWR(statusKey, fetcher);

    const status = data?.status;
    const isActive = data?.is_active;

    /* ================= DISMISS ================= */
    useEffect(() => {
        if (typeof window !== "undefined") {
            const wasDismissed = localStorage.getItem("beta_banner_dismissed");
            if (wasDismissed === "true") setDismissed(true);
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
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (err: any) {
            await Swal.fire({
                icon: "error",
                title: "Activation Failed",
                text: err?.response?.data?.error || "Please try again.",
            });
        } finally {
            setActivating(false);
        }
    };

    /* ================= REDIRECT APPLY ================= */
    const handleRedirectToApply = () => {
        router.push("/pages/landlord/beta-program/joinForm");
        // 👆 change this route to wherever your beta form page is
    };

    if (isLoading) return null;

    /* ================= STATE ================= */
    let currentState: "active" | "approved" | "pending" | "rejected" | "default";

    if (status === "approved" && isActive) currentState = "active";
    else if (status === "approved") currentState = "approved";
    else if (status === "pending") currentState = "pending";
    else if (status === "rejected") currentState = "rejected";
    else currentState = "default";

    if (currentState === "active" && dismissed) return null;

    /* ================= ACTIVE STRIP ================= */
    if (currentState === "active") {
        return (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <p className="text-xs sm:text-sm font-medium truncate">
                                <span className="font-semibold">Beta Active</span>
                                <span className="hidden sm:inline">
                                    {" "}
                                    — Discounted transaction fees enabled
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 rounded-lg hover:bg-white/20"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ================= CONFIG ================= */
    const configs = {
        approved: {
            gradient: "from-blue-500 to-indigo-500",
            icon: Zap,
            title: "Beta Approved 🎊",
            description: "Activate to unlock benefits",
            actionLabel: "Activate",
            actionHandler: handleActivateBeta,
            loading: activating,
        },
        pending: {
            gradient: "from-blue-500 to-cyan-500",
            icon: Clock,
            title: "Beta Under Review",
            description: "We’ll notify you once approved",
        },
        rejected: {
            gradient: "from-gray-500 to-gray-600",
            icon: XCircle,
            title: "Beta Closed",
            description: "We’ll reach out if it reopens",
        },
        default: {
            gradient: "from-blue-500 to-emerald-500",
            icon: Rocket,
            title: "Join UpKyp Beta 🚀",
            description: "Early access + discounted fees",
            actionLabel: "Apply",
            actionHandler: handleRedirectToApply,
        },
    };

    const config = configs[currentState];
    const Icon = config.icon;

    /* ================= CARD ================= */
    return (
        <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <div
                className={`max-w-7xl mx-auto rounded-xl bg-gradient-to-r ${config.gradient}
                    text-white shadow-md p-4`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold truncate">
                                {config.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/80">
                                {config.description}
                            </p>
                        </div>
                    </div>

                    {config.actionLabel && (
                        <button
                            onClick={config.actionHandler}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                                text-sm font-bold px-4 py-2.5 rounded-lg
                                bg-white text-gray-900 hover:bg-white/90 transition-all"
                        >
                            {config.actionLabel}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
