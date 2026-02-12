"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Mail, User, Sparkles, ShieldCheck } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import Swal from "sweetalert2";

export default function JoinBetaPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();
    const [loading, setLoading] = useState(false);

    /** Fetch session */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /** Redirect non-landlords */
    useEffect(() => {
        if (user && user.userType !== "landlord") {
            router.replace("/pages/error/accessDenied");
        }
    }, [user, router]);

    const handleActivate = async () => {
        if (!user) return;

        setLoading(true);

        try {
            await axios.post("/api/landlord/beta", {
                user_id: user.user_id,
            });

            await Swal.fire({
                icon: "success",
                title: "Beta Activated 🎉",
                text: "Your 60-day Beta access has started successfully!",
                confirmButtonColor: "#2563eb",
            });

            router.push("/pages/landlord/dashboard");

        } catch (err: any) {
            await Swal.fire({
                icon: "info",
                title: "Already Subscribed",
                text:
                    err.response?.data?.error ||
                    "You already have an active subscription.",
                confirmButtonColor: "#2563eb",
            });

            router.push("/pages/landlord/subscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold shadow">
                        🚀 BETA ACCESS PROGRAM 1.0
                    </span>

                    <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
                        UpKyp Beta Program
                    </h1>

                    <p className="mt-3 text-sm text-gray-600">
                        Exclusive early access for selected landlords.
                    </p>
                </div>

                {/* Info Section */}
                <div className="space-y-6">

                    <Feature
                        icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                        title="60 Days Free Premium Access"
                        description="Unlock premium subscription features at no cost for 60 days."
                    />

                    <Feature
                        icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
                        title="Discounted Transaction Fees"
                        description="Enjoy reduced transaction processing fees during beta."
                    />

                    <Feature
                        icon={<Rocket className="w-5 h-5 text-purple-600" />}
                        title="Early Feature Access"
                        description="Be the first to experience new platform upgrades."
                    />
                </div>

                {/* User Info */}
                <div className="mt-8 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                    <InfoField
                        label="Full Name"
                        value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                        icon={<User className="w-4 h-4 text-gray-400" />}
                    />
                    <InfoField
                        label="Email Address"
                        value={user?.email ?? ""}
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                    />
                </div>

                {/* CTA */}
                <button
                    onClick={handleActivate}
                    disabled={loading}
                    className="w-full mt-8 px-6 py-3 rounded-xl text-white font-semibold
                        bg-gradient-to-r from-blue-600 to-emerald-600
                        hover:from-blue-700 hover:to-emerald-700
                        shadow-lg transition disabled:opacity-60"
                >
                    {loading ? "Activating..." : "Activate Beta Program"}
                </button>

                <p className="mt-5 text-center text-xs text-gray-500">
                    Your beta subscription will start immediately and expire automatically after 60 days.
                </p>
            </div>
        </div>
    );
}

/* ================= COMPONENTS ================= */

function Feature({ icon, title, description }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}

function InfoField({ label, value, icon }: any) {
    return (
        <div>
            <label className="text-xs text-gray-500">{label}</label>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-800">
                {icon}
                {value}
            </div>
        </div>
    );
}
