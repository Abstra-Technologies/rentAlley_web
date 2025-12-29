"use client";

import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import { validatePassword } from "@/utils/validation/passwordValidation";
import Link from "next/link";

export default function DesktopRegisterForm() {
    const {
        formData,
        errors,
        error,
        error_2,
        agreeToTerms,
        handleCheckboxChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isRegistering,
        handleChange,
        handleGoogleSignup,
        handleSubmit,
    } = useRegisterForm();

    const passwordValidation = validatePassword(formData.password);
    const passwordsMatch =
        formData.password && formData.password === formData.confirmPassword;

    return (
        <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/30">
            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                Register as{" "}
                <span className="text-blue-600">{formData.role}</span>
            </h2>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            {error_2 && (
                <p className="text-red-500 text-sm mb-2">
                    {decodeURIComponent(error_2)}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={isRegistering}
                    />
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
                {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email}</p>
                )}

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="w-full px-4 py-2 border rounded-lg pr-16"
                        disabled={isRegistering}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {/* Password Rules */}
                {formData.password && (
                    <div className="text-xs space-y-1">
                        <p className={passwordValidation.length ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.length ? "✔" : "✖"} At least 8 characters
                        </p>
                        <p className={passwordValidation.uppercase ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.uppercase ? "✔" : "✖"} One uppercase letter
                        </p>
                        <p className={passwordValidation.lowercase ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.lowercase ? "✔" : "✖"} One lowercase letter
                        </p>
                        <p className={passwordValidation.number ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.number ? "✔" : "✖"} One number
                        </p>
                        <p className={passwordValidation.special ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.special ? "✔" : "✖"} One special character
                        </p>
                    </div>
                )}

                {/* Confirm Password */}
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-2 border rounded-lg pr-16"
                        disabled={isRegistering}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    >
                        {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {formData.confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs">
                        Passwords do not match
                    </p>
                )}

                {/* Terms */}
                <div className="flex items-center text-xs">
                    <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={handleCheckboxChange}
                        disabled={isRegistering}
                        className="mr-2"
                    />
                    <span>
                        I agree to the{" "}
                        <Link
                            href="/pages/terms-services"
                            className="text-blue-600 underline"
                        >
                            Terms
                        </Link>{" "}
                        &{" "}
                        <Link
                            href="/pages/terms-services"
                            className="text-blue-600 underline"
                        >
                            Privacy
                        </Link>
                    </span>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={
                        isRegistering ||
                        !agreeToTerms ||
                        !passwordValidation.isStrong ||
                        !passwordsMatch
                    }
                    className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                    {isRegistering ? "Registering..." : "Create Account"}
                </button>

                {/* Google */}
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
