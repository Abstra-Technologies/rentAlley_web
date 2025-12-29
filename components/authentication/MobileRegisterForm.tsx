"use client";

import { useRegisterForm } from "@/hooks/authentication/useRegisterForm";
import { validatePassword } from "@/utils/validation/passwordValidation";
import Link from "next/link";

export default function MobileRegisterForm() {
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
        <div className="sm:hidden w-full max-w-xs mx-auto bg-white/90 p-4 rounded-xl shadow-lg mt-10">
            <h2 className="text-lg font-bold text-center mb-1">
                Create Account
            </h2>
            <p className="text-center text-[11px] mb-3">
                Register as{" "}
                <span className="text-blue-600 font-medium">
                    {formData.role}
                </span>
            </p>

            {error && (
                <p className="text-red-500 text-[10px] mb-1 text-center">
                    {error}
                </p>
            )}
            {error_2 && (
                <p className="text-red-500 text-[10px] mb-1 text-center">
                    {decodeURIComponent(error_2)}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-2" noValidate>
                {/* Names */}
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

                {/* Email */}
                <input
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    disabled={isRegistering}
                />
                {errors.email && (
                    <p className="text-red-500 text-[10px]">
                        {errors.email}
                    </p>
                )}

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="w-full px-3 py-2 border rounded-lg text-xs pr-14"
                        disabled={isRegistering}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-600"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {/* Password Rules */}
                {formData.password && (
                    <div className="space-y-0.5 text-[10px]">
                        <p className={passwordValidation.length ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.length ? "✔" : "✖"} 8+ characters
                        </p>
                        <p className={passwordValidation.uppercase ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.uppercase ? "✔" : "✖"} Uppercase letter
                        </p>
                        <p className={passwordValidation.lowercase ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.lowercase ? "✔" : "✖"} Lowercase letter
                        </p>
                        <p className={passwordValidation.number ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.number ? "✔" : "✖"} Number
                        </p>
                        <p className={passwordValidation.special ? "text-green-600" : "text-red-500"}>
                            {passwordValidation.special ? "✔" : "✖"} Special character
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
                        className="w-full px-3 py-2 border rounded-lg text-xs pr-14"
                        disabled={isRegistering}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-600"
                    >
                        {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {formData.confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-[10px]">
                        Passwords do not match
                    </p>
                )}

                {/* Terms */}
                <div className="flex items-start text-[10px] leading-tight">
                    <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={handleCheckboxChange}
                        disabled={isRegistering}
                        className="mr-1 mt-0.5"
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
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs disabled:opacity-50"
                >
                    {isRegistering ? "Registering..." : "Create Account"}
                </button>

                {/* Google */}
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
