"use client";

import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import Link from "next/link";

export default function MobileRegisterForm() {
    const {
        formData, errors, error, error_2, focusedField, setFocusedField,
        agreeToTerms, handleCheckboxChange, showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword, isRegistering,
        handleChange, handleGoogleSignup, handleSubmit
    } = useRegisterForm();

    return (
        <div className="sm:hidden w-full max-w-xs mx-auto bg-white/90 p-4 rounded-xl shadow-lg mt-10">
            <h2 className="text-lg font-bold text-center mb-2">Create Account</h2>
            <p className="text-center text-xs mb-3">Register as {formData.role}</p>

            <form onSubmit={handleSubmit} className="space-y-2" noValidate>
                <input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />
                <input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />
                <input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />
                {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}

                <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />

                <div className="flex items-center text-[10px]">
                    <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={handleCheckboxChange}
                        disabled={isRegistering}
                        className="mr-1"
                    />
                    <span>I agree to the <Link href="/pages/terms-services" className="text-blue-600 underline">Terms</Link> & <Link href="/pages/terms-services" className="text-blue-600 underline">Privacy</Link></span>
                </div>

                <button
                    type="submit"
                    disabled={isRegistering || !agreeToTerms}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs"
                >
                    {isRegistering ? "Registering..." : "Create Account"}
                </button>

                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isRegistering}
                    className="w-full bg-white border py-2 rounded-lg text-xs mt-1"
                >
                    Sign up with Google
                </button>
            </form>
        </div>
    );
}
