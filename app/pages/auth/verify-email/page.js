"use client"

import { useState } from "react";

export default function VerifyEmail() {
    const [otp, setOtp] = useState(["", "", "", ""]);

    const handleInputChange = (value, index) => {
        if (!/^\d$/.test(value) && value !== "") return; // Allow only single digits
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to the next input if a digit is entered
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleBackspace = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = () => {
        const otpValue = otp.join("");
        alert(`Submitted OTP: ${otpValue}`);
        //Add OTP logic here
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-sm w-full">
                {/* Rentahan Logo */}
                <h1 className="text-2xl text-center text-gray-800 mb-6">Rentahan Logo</h1>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Verify Account!
                </h2>
                <p className="text-sm text-gray-600 text-center mb-8">
                    Enter the 4-digit code sent to your email.
                </p>

                {/* OTP Inputs */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleInputChange(e.target.value, index)}
                            onKeyDown={(e) => handleBackspace(e, index)}
                            className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700"
                >
                    Verify OTP
                </button>

                <p className="text-sm text-gray-600 text-center mt-6">
                    Didn&#39;t receive the code?{" "}
                    <a href="#" className="text-blue-600 font-semibold hover:underline">
                        Resend Code
                    </a>
                </p>
            </div>
        </div>
    );
}
