"use client";

import { Rocket, ArrowRight, CheckCircle, Clock, Zap, XCircle } from "lucide-react";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function LandlordBetaBanner() {
    const { user } = useAuthStore();
    const [activating, setActivating] = useState(false);
    const [applying, setApplying] = useState(false);

    const statusKey = user?.user_id
        ? `/api/landlord/beta/status?user_id=${user.user_id}`
        : null;

    const { data, isLoading } = useSWR(statusKey, fetcher);

    const status = data?.status;      // none | pending | approved | rejected
    const isActive = data?.is_active; // boolean

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
                text:
                    err?.response?.data?.error ||
                    "Unable to submit beta request.",
            });
        } finally {
            setApplying(false);
        }
    };

    /* ================= LOADING ================= */
    if (isLoading) return null;

    /* ================= APPROVED + ACTIVE ================= */
    if (user && status === "approved" && isActive) {
        return (
            <Banner
                icon={<CheckCircle className="w-5 h-5" />}
                title="You’re in the UPKYP Beta 🎉"
                description="Full access unlocked with discounted transaction fees."
                gradient="from-emerald-600 to-green-600"
            />
        );
    }

    /* ================= APPROVED NOT ACTIVE ================= */
    if (user && status === "approved" && !isActive) {
        return (
            <Banner
                icon={<Zap className="w-5 h-5" />}
                title="Beta Approved 🎉"
                description="Activate your beta access when you’re ready — no automatic charges."
                gradient="from-indigo-600 to-blue-600"
                action={
                    <ActionButton
                        loading={activating}
                        label={activating ? "Activating..." : "Activate Beta"}
                        onClick={handleActivateBeta}
                    />
                }
            />
        );
    }

    /* ================= PENDING ================= */
    if (status === "pending") {
        return (
            <Banner
                icon={<Clock className="w-5 h-5" />}
                title="Beta Request Under Review"
                description="Your beta application is being reviewed by our team."
                gradient="from-blue-600 to-emerald-600"
            />
        );
    }

    /* ================= REJECTED ================= */
    if (status === "rejected") {
        return (
            <Banner
                icon={<XCircle className="w-5 h-5" />}
                title="Beta Application Not Approved"
                description="Thank you for your interest. We’ll notify you if beta access reopens."
                gradient="from-gray-600 to-gray-700"
            />
        );
    }

    /* ================= NONE ================= */
    return (
        <Banner
            icon={<Rocket className="w-5 h-5" />}
            title="Join the UPKYP Beta 🚀"
            description="Get full platform access with discounted transaction fees during beta."
            gradient="from-blue-600 to-emerald-600"
            action={
                <ActionButton
                    loading={applying}
                    label={applying ? "Submitting..." : "Join Beta"}
                    onClick={handleApplyBeta}
                />
            }
        />
    );
}

/* ================= UI HELPERS ================= */

function Banner({
                    icon,
                    title,
                    description,
                    gradient,
                    action,
                }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="px-4 pt-4">
            <div
                className={`max-w-6xl mx-auto rounded-2xl border border-white/20
        bg-gradient-to-r ${gradient}
        text-white shadow-lg p-4 sm:p-5`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3">
                        {icon}
                        <div>
                            <h3 className="text-sm sm:text-base font-bold">{title}</h3>
                            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                                {description}
                            </p>
                        </div>
                    </div>
                    {action && <div className="sm:ml-auto">{action}</div>}
                </div>
            </div>
        </div>
    );
}

function ActionButton({
                          label,
                          onClick,
                          loading,
                      }: {
    label: string;
    onClick: () => void;
    loading: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`w-full sm:w-auto
        inline-flex items-center justify-center gap-2
        text-xs sm:text-sm font-semibold
        px-4 py-2.5 rounded-lg
        transition active:scale-95
        ${loading
                ? "bg-white/10 cursor-not-allowed"
                : "bg-white/20 hover:bg-white/30"}`}
        >
            {label}
            <ArrowRight className="w-4 h-4" />
        </button>
    );
}
