import Link from "next/link";

export default function RegisterAs() {
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
                    <Link href="../../pages/auth/register">
                        <button
                            className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md hover:bg-blue-700 transition duration-300 mb-4"
                            type="button"
                        >
                            Tenant
                        </button>
                    </Link>

                    {/* Landlord Button */}
                    <Link href="../../pages/auth/register">
                        <button
                            className="w-full bg-blue-600 text-white py-3 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
                            type="button"
                        >
                            Landlord
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
