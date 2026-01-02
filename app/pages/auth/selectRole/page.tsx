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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-6 sm:px-6 sm:py-10">
            {/* Background Image */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="City background"
                fill
                priority
                className="absolute inset-0 object-cover opacity-30"
            />

            {/* Main Card */}
            <div
                className="
          relative z-10 w-full
          max-w-sm
          sm:max-w-md
          bg-white
          border border-gray-200
          rounded-3xl
          shadow-lg
          p-6 sm:p-8
        "
            >
                {/* Logo */}
                <div className="mb-6 text-center sm:mb-8">
                    <div
                        className="typographica text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent"
                        style={{
                            backgroundImage: "linear-gradient(90deg, #60A5FA, #34D399)",
                            textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        }}
                    >
                        Upkyp
                    </div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm tracking-wide text-gray-500">
                        Connect more. Manage less.
                    </p>
                </div>

                {/* Title */}
                <h2 className="mb-6 sm:mb-8 text-center text-xl sm:text-2xl font-semibold text-gray-800">
                    Register As
                </h2>

                {/* Role Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    {/* Tenant */}
                    <button
                        onClick={() => handleSelectRole("tenant")}
                        className="
              group relative flex-1 overflow-hidden
              rounded-2xl bg-blue-600 py-3 sm:py-4
              text-white shadow-md
              transition-all hover:scale-[1.03] hover:shadow-lg
            "
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-20" />
                        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                            <UserIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                            <span className="text-sm sm:text-base font-medium">
                Tenant
              </span>
                        </div>
                    </button>

                    {/* Landlord */}
                    <button
                        onClick={() => handleSelectRole("landlord")}
                        className="
              group relative flex-1 overflow-hidden
              rounded-2xl bg-emerald-600 py-3 sm:py-4
              text-white shadow-md
              transition-all hover:scale-[1.03] hover:shadow-lg
            "
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-20" />
                        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                            <HomeIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                            <span className="text-sm sm:text-base font-medium">
                Landlord
              </span>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/pages/auth/login")}
                        className="font-medium text-gray-900 underline-offset-4 transition hover:underline"
                    >
                        Sign in here
                    </button>
                </p>
            </div>
        </div>
    );
}
