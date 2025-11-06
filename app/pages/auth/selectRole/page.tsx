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
    logEvent("Role Selection", "User Interaction", `Selected Role: ${role}`, 1);
  };

  return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-emerald-600 to-teal-500 px-6 py-10">
        {/* Subtle Background Image Overlay */}
        <Image
            src="/images/hero-section.jpeg"
            alt="Cityscape background"
            fill
            className="absolute inset-0 object-cover opacity-30 blur-sm"
            priority
        />

        {/* Main Card */}
        <div className="relative z-10 backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10 sm:p-12 w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl font-extrabold text-white drop-shadow-md">
              Up<span className="text-emerald-300">kyp</span>
            </div>
            <p className="text-sm text-emerald-100 mt-2 tracking-wide">
             Connect more. Manage Less.
            </p>
          </div>

          {/* Title */}
          <h2 className="text-center text-3xl font-semibold text-white mb-10 tracking-tight">
            Register As
          </h2>

          {/* Role Selection */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Tenant */}
            <button
                onClick={() => handleSelectRole("tenant")}
                className="group flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white py-5 shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="flex items-center justify-center gap-3 relative z-10">
                <UserIcon className="w-8 h-8 text-white" />
                <span className="text-lg font-medium">Tenant</span>
              </div>
            </button>

            {/* Landlord */}
            <button
                onClick={() => handleSelectRole("landlord")}
                className="group flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-5 shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="flex items-center justify-center gap-3 relative z-10">
                <HomeIcon className="w-8 h-8 text-white" />
                <span className="text-lg font-medium">Landlord</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-white/80 mt-8">
            Already have an account?{" "}
            <button
                onClick={() => router.push("/pages/auth/login")}
                className="text-emerald-200 font-medium hover:text-white underline underline-offset-4 transition"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
  );
}
