import Link from 'next/link';

export default function ForgotPassword() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-sm w-full">
                <h1 className="text-2xl text-center text-gray-800 mb-3">Rentahan Logo</h1>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Forgot Password
                </h2>
                <p className="text-sm text-gray-600 text-center mb-8">
                    Enter your email and a new password to reset your account.
                </p>

                <form>
                    {/* Email Address */}
                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="text-gray-800 text-sm mb-2 block"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    {/* New Password */}
                    <div className="mb-6">
                        <label
                            htmlFor="new-password"
                            className="text-gray-800 text-sm mb-2 block"
                        >
                            New Password
                        </label>
                        <input
                            id="new-password"
                            name="new-password"
                            type="password"
                            className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your new password"
                            required
                        />
                    </div>

                    {/* Confirm New Password */}
                    <div className="mb-6">
                        <label
                            htmlFor="confirm-password"
                            className="text-gray-800 text-sm mb-2 block"
                        >
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm your new password"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition"
                    >
                        Reset Password
                    </button>
                </form>

                {/* Go Back to Login */}
                <p className="text-sm text-gray-600 text-center mt-6">
                    Remember your password?{" "}
                    <Link
                        href="../auth/login"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}