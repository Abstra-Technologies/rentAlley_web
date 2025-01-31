'use client';

import Link from "next/link";
import useRoleStore from "../../../../pages/zustand/store";

import { useRouter } from "next/navigation";
export default function RegisterAs() {
    const setRole = useRoleStore((state) => state.setRole);
    const router = useRouter();
    const handleSelectRole = (role) => {
        setRole(role);
        router.push("/pages/auth/register");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="text-2xl font-bold">Rentahan Logo</div>
                </div>

                {/* "Register As" Heading */}
                <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">
                    Register As
                </h2>

                {/* Buttons */}
                <div className="space-y-4">
                    {/* Tenant Button */}
                        <button
                            className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md hover:bg-blue-700 transition duration-300 mb-4"
                            type="button"
                            onClick={() => handleSelectRole("tenant")}
                        >
                            Tenant
                        </button>

                    {/* Landlord Button */}
                        <button
                            className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
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
