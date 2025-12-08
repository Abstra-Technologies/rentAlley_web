"use client";

import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import Link from "next/link";

export default function DesktopRegisterForm() {
    const {
        formData, errors, error, error_2, focusedField, setFocusedField,
        agreeToTerms, handleCheckboxChange, showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword, isRegistering,
        handleChange, handleGoogleSignup, handleSubmit
    } = useRegisterForm();

    return (
        <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/30 mt-0">
            {/* Form Header */}
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                Register as <span className="text-blue-600">{formData.role}</span>
            </h2>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {error_2 && <p className="text-red-500 text-sm mb-2">{decodeURIComponent(error_2)}</p>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <input
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={isRegistering}
                    />
                    {/* Last Name */}
                    <input
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={isRegistering}
                    />
                </div>

                {/* Email */}
                <input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled={isRegistering}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}

                {/* Password */}
                <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled={isRegistering}
                />

                {/* Confirm Password */}
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled={isRegistering}
                />

                {/* Terms */}
                <div className="flex items-center text-xs">
                    <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={handleCheckboxChange}
                        disabled={isRegistering}
                        className="mr-2"
                    />
                    <span>I agree to the <Link href="/pages/terms-services" className="text-blue-600 underline">Terms</Link> & <Link href="/pages/terms-services" className="text-blue-600 underline">Privacy</Link></span>
                </div>

                <button
                    type="submit"
                    disabled={isRegistering || !agreeToTerms}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg"
                >
                    {isRegistering ? "Registering..." : "Create Account"}
                </button>

                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isRegistering}
                    className="w-full bg-white border py-2 rounded-lg mt-2"
                >
                    Sign up with Google
                </button>
            </form>
        </div>
    );
}
