"use client";

import useRoleStore from "../../../../zustand/store";
import { logEvent } from "../../../../utils/gtag";
import Image from "next/image";

import { useRouter } from "next/navigation";
export default function RegisterAs() {
  const setRole = useRoleStore((state) => state.setRole);
  const router = useRouter();
  const handleSelectRole = (role) => {
    setRole(role);
    router.push("/pages/auth/register");
    logEvent("Role Selection", "User Interaction", `Selected Role: ${role}`, 1);
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-100 overflow-hidden">
      <Image
        src="/images/hero-section.jpeg"
        alt="Cityscape view of high-rise buildings"
        fill
        className="absolute inset-0 object-cover brightness-75"
        priority
      />

      <div className="relative z-10 bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="text-3xl font-bold text-blue-600">Hestia</div>
        </div>

        {/* "Register As" Heading */}
        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-6">
          Register As
        </h2>

        {/* Buttons */}
        <div className="space-y-5">
          {/* Tenant Button */}
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all"
            type="button"
            onClick={() => handleSelectRole("tenant")}
          >
            Tenant
          </button>

          {/* Landlord Button */}
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all"
            type="button"
            onClick={() => handleSelectRole("landlord")}
          >
            Landlord
          </button>
        </div>
      </div>
    </div>
  );
}
