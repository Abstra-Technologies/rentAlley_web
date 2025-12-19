"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { AlertCircle, Clock, XCircle, CheckCircle } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Props {
    landlord_id: string; // Now string, not number
}

interface ProfileStatusData {
    status: "incomplete" | "pending" | "rejected" | "verified";
    completion?: number;
    missingFields?: string[];
}

export default function LandlordProfileStatus({ landlord_id }: Props) {
    const router = useRouter();

    const { data, error, isLoading } = useSWR<ProfileStatusData>(
        `/api/landlord/${landlord_id}/profileStatus`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000, // Cache for 1 minute
        }
    );

    // Loading state – slim skeleton
    if (isLoading) {
        return (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 animate-pulse">
                <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-md bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-32" />
                        <div className="h-2 bg-gray-100 rounded w-48" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !data) {
        return null; // Silently fail – don't distract user if API down
    }

    const { status, completion = 0 } = data;

    /* Shared Tailwind classes for slim design */
    const baseCard = "rounded-lg shadow-sm border p-2.5 transition-all duration-200";
    const iconBox = "p-1.5 rounded-md bg-opacity-60 flex items-center justify-center flex-shrink-0";
    const titleText = "text-[13px] font-semibold leading-tight";
    const descText = "text-[11px] text-gray-600 leading-snug mt-0.5";
    const buttonText = "mt-1.5 text-[11px] font-medium underline hover:opacity-75 transition";

    const renderBanner = () => {
        switch (status) {
            case "pending":
                return (
                    <div className={`${baseCard} bg-yellow-50 border-yellow-200`}>
                        <div className="flex items-start gap-2.5">
                            <div className={`${iconBox} bg-yellow-100`}>
                                <Clock className="w-4 h-4 text-yellow-700" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-yellow-800`}>Documents Under Review</p>
                                <p className={`${descText} text-yellow-700`}>
                                    We’re processing your submitted documents. This usually takes 1–3 business days.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case "rejected":
                return (
                    <div className={`${baseCard} bg-red-50 border-red-200`}>
                        <div className="flex items-start gap-2.5">
                            <div className={`${iconBox} bg-red-100`}>
                                <XCircle className="w-4 h-4 text-red-700" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-red-800`}>Verification Rejected</p>
                                <p className={`${descText} text-red-700`}>
                                    Some documents need correction. Please review feedback and resubmit.
                                </p>
                                <button
                                    onClick={() => router.push("/pages/landlord/verification")}
                                    className={`${buttonText} text-red-700`}
                                >
                                    View Details & Resubmit →
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "incomplete":
                return (
                    <div className={`${baseCard} bg-orange-50 border-orange-200`}>
                        <div className="flex items-start gap-2.5">
                            <div className={`${iconBox} bg-orange-100`}>
                                <AlertCircle className="w-4 h-4 text-orange-700" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-orange-800`}>Complete Your Profile</p>
                                <p className={`${descText} text-orange-700`}>
                                    Add missing information to unlock full platform features.
                                </p>

                                {/* Thin progress bar */}
                                <div className="mt-2 w-full bg-orange-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-orange-600 h-1.5 rounded-full transition-all duration-700"
                                        style={{ width: `${completion}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-orange-600 mt-1">{completion}% complete</p>

                                <button
                                    onClick={() => router.push("/pages/landlord/verification")}
                                    className={`${buttonText} text-orange-700`}
                                >
                                    Complete Profile Now →
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "verified":
                return (
                    <div className={`${baseCard} bg-green-50 border-green-200`}>
                        <div className="flex items-start gap-2.5">
                            <div className={`${iconBox} bg-green-100`}>
                                <CheckCircle className="w-4 h-4 text-green-700" />
                            </div>
                            <div className="flex-1">
                                <p className={`${titleText} text-green-800`}>Profile Verified ✓</p>
                                <p className={`${descText} text-green-700`}>
                                    You’re fully verified and ready to manage properties.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return <>{renderBanner()}</>;
}