"use client";

import { Rocket, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function LandlordBetaBanner() {
    const router = useRouter();
    const { user } = useAuthStore();

    const { data } = useSWR(
        user?.user_id
            ? `/api/landlord/beta/status?user_id=${user.user_id}`
            : null,
        fetcher
    );

    const status = data?.status; // none | pending | approved | rejected

    if (!user || status === "approved") {
        return (
            <div className="px-4 pt-4">
                <div className="max-w-6xl mx-auto rounded-2xl border border-emerald-200
          bg-gradient-to-r from-emerald-600 to-green-600
          text-white shadow-lg p-4 sm:p-5"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                            <h3 className="text-sm sm:text-base font-bold">
                                You’re in the UPKYP Beta 🎉
                            </h3>
                            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                                Full access unlocked with discounted transaction fees.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pt-4">
            <div className="max-w-6xl mx-auto rounded-2xl border border-blue-200
        bg-gradient-to-r from-blue-600 to-emerald-600
        text-white shadow-lg p-4 sm:p-5"
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                    {/* Text */}
                    <div className="flex items-start sm:items-center gap-3">
                        {status === "pending" ? (
                            <Clock className="w-5 h-5 shrink-0" />
                        ) : (
                            <Rocket className="w-5 h-5 shrink-0" />
                        )}

                        <div>
                            <h3 className="text-sm sm:text-base font-bold leading-tight">
                                {status === "pending"
                                    ? "Beta Request Under Review"
                                    : "Join the UPKYP Beta 🚀"}
                            </h3>

                            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                                {status === "pending"
                                    ? "Your beta application is being reviewed by our team."
                                    : "Get full platform access with discounted transaction fees during beta."}
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    {status !== "pending" && (
                        <div className="sm:ml-auto">
                            <button
                                onClick={() => router.push("/pages/landlord/beta-program")}
                                className="inline-flex items-center gap-2
                  text-xs sm:text-sm font-semibold
                  bg-white/15 hover:bg-white/25
                  px-4 py-2 rounded-lg transition"
                            >
                                Join Beta
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
