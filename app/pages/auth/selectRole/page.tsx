"use client";

import useRoleStore from "../../../../zustand/store";
import { logEvent } from "../../../../utils/gtag";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserIcon, HomeIcon } from "@heroicons/react/24/solid";

export default function RegisterAs() {
    const setRole = useRoleStore((state) => state.setRole);
    const router = useRouter();

    const handleSelectRole = (role: string) => {
        setRole(role);
        router.push("/pages/auth/register");
        logEvent(
            "Role Selection",
            "User Interaction",
            `Selected Role: ${role}`,
            1
        );
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10 overflow-hidden">
            {/* Background Image (VISIBLE) */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="City background"
                fill
                className="absolute inset-0 object-cover opacity-30"
                priority
            />

            {/* Soft white wash (top → bottom) */}

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-sm sm:max-w-lg bg-white border border-gray-200 rounded-3xl shadow-xl p-6 sm:p-10">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="text-3xl sm:text-5xl font-extrabold text-gray-900">
                        Upkyp
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 tracking-wide">
                        Connect more. Manage less.
                    </p>
                </div>

                {/* Title */}
                <h2 className="text-center text-xl sm:text-3xl font-semibold text-gray-800 mb-6 sm:mb-10">
                    Register As
                </h2>

                {/* Role Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Tenant */}
                    <button
                        onClick={() => handleSelectRole("tenant")}
                        className="group flex-1 relative overflow-hidden rounded-2xl
                                   bg-blue-600 text-white
                                   py-3 sm:py-5 shadow-md
                                   transition-all hover:shadow-lg hover:scale-[1.03]"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span className="text-sm sm:text-lg font-medium">
                                Tenant
                            </span>
                        </div>
                    </button>

                    {/* Landlord */}
                    <button
                        onClick={() => handleSelectRole("landlord")}
                        className="group flex-1 relative overflow-hidden rounded-2xl
                                   bg-emerald-600 text-white
                                   py-3 sm:py-5 shadow-md
                                   transition-all hover:shadow-lg hover:scale-[1.03]"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                            <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span className="text-sm sm:text-lg font-medium">
                                Landlord
                            </span>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/pages/auth/login")}
                        className="text-gray-900 font-medium hover:underline underline-offset-4 transition"
                    >
                        Sign in here
                    </button>
                </p>
            </div>
        </div>
    );
}
