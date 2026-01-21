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
} from "lucide-react";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

type ProfileStatus =
    | "incomplete"
    | "pending"
    | "rejected"
    | "verified";

interface Props {
    landlord_id: string;
}

interface ProfileStatusResponse {
    status?: ProfileStatus;
}

export default function LandlordProfileStatus({
                                                  landlord_id,
                                              }: Props) {
    const router = useRouter();

    const { data, error, isLoading } = useSWR<ProfileStatusResponse>(
        landlord_id
            ? `/api/landlord/${landlord_id}/profileStatus`
            : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60_000,
        }
    );

    /**
     * 🧠 CORE RULE:
     * - NO RECORD
     * - NO DATA
     * - API ERROR
     * → ALL MEAN "INCOMPLETE"
     */
    const status: ProfileStatus =
        data?.status ?? "incomplete";

    const base =
        "rounded-lg border p-2.5 shadow-sm transition-all";
    const iconBox =
        "p-1.5 rounded-md flex items-center justify-center";
    const title =
        "text-[13px] font-semibold";
    const desc =
        "text-[11px] mt-0.5";
    const action =
        "mt-1.5 text-[11px] font-medium underline hover:opacity-75";

    /** ⏳ Loading skeleton (optional, keeps layout stable) */
    if (isLoading) {
        return (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 animate-pulse">
                <div className="flex gap-2">
                    <div className="w-7 h-7 rounded bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-32" />
                        <div className="h-2 bg-gray-100 rounded w-48" />
                    </div>
                </div>
            </div>
        );
    }

    /** ❌ Error → still show Verify (never hide) */
    if (error) {
        console.error("Profile status error:", error);
    }

    /** 🎯 FINAL RENDER */
    switch (status) {
        /** ❌ NOT VERIFIED / NO RECORD */
        case "incomplete":
            return (
                <div className={`${base} bg-orange-50 border-orange-200`}>
                    <div className="flex gap-2.5">
                        <div className={`${iconBox} bg-orange-100`}>
                            <AlertCircle className="w-4 h-4 text-orange-700" />
                        </div>
                        <div className="flex-1">
                            <p className={`${title} text-orange-800`}>
                                Verification Required
                            </p>
                            <p className={`${desc} text-orange-700`}>
                                Please submit your verification documents to continue.
                            </p>
                            <button
                                onClick={() =>
                                    router.push("/pages/landlord/verification")
                                }
                                className={`${action} text-orange-700`}
                            >
                                Verify Now→
                            </button>
                        </div>
                    </div>
                </div>
            );

        /** ⏳ PENDING */
        case "pending":
            return (
                <div className={`${base} bg-yellow-50 border-yellow-200`}>
                    <div className="flex gap-2.5">
                        <div className={`${iconBox} bg-yellow-100`}>
                            <Clock className="w-4 h-4 text-yellow-700" />
                        </div>
                        <div className="flex-1">
                            <p className={`${title} text-yellow-800`}>
                                Documents Under Review
                            </p>
                            <p className={`${desc} text-yellow-700`}>
                                Your documents were submitted and are awaiting approval.
                            </p>
                        </div>
                    </div>
                </div>
            );

        /** ❌ REJECTED */
        case "rejected":
            return (
                <div className={`${base} bg-red-50 border-red-200`}>
                    <div className="flex gap-2.5">
                        <div className={`${iconBox} bg-red-100`}>
                            <XCircle className="w-4 h-4 text-red-700" />
                        </div>
                        <div className="flex-1">
                            <p className={`${title} text-red-800`}>
                                Verification Rejected
                            </p>
                            <p className={`${desc} text-red-700`}>
                                Some documents need correction before approval.
                            </p>
                            <button
                                onClick={() =>
                                    router.push("/pages/landlord/verification")
                                }
                                className={`${action} text-red-700`}
                            >
                                Review & Resubmit →
                            </button>
                        </div>
                    </div>
                </div>
            );

        /** ✅ VERIFIED */
        case "verified":
            return (
                <div className={`${base} bg-green-50 border-green-200`}>
                    <div className="flex gap-2.5">
                        <div className={`${iconBox} bg-green-100`}>
                            <CheckCircle className="w-4 h-4 text-green-700" />
                        </div>
                        <div className="flex-1">
                            <p className={`${title} text-green-800`}>
                                Profile Verified
                            </p>
                            <p className={`${desc} text-green-700`}>
                                You’re fully verified and can access all features.
                            </p>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
