"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loadingScreen";
import LoginForm from "@/components/authentication/loginForm";
import MobileLoginForm from "@/components/authentication/mobileLoginForm";
import AuthBackground from "@/components/authentication/AuthBackground";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading authentication..." />}>
      <Login />
    </Suspense>
  );
}

function Login() {
  return (
    <AuthBackground>
      <div className="flex flex-col min-h-screen">
        {/* Main - Centered */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 py-12 gap-12 lg:gap-20">
          {/* Hero - Desktop */}
          <div className="hidden lg:block max-w-lg text-center lg:text-left space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Your Property Journey, Simplified.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 mt-2">
                Upkyp
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              From browsing to billing, Upkyp keeps your rentals organized and
              hassle-free.
            </p>
          </div>

          {/* Form */}
          <div className="w-full max-w-md">
            {/* Desktop Form */}
            <div className="hidden sm:block">
              <LoginForm />
            </div>

            {/* Mobile Form */}
            <div className="sm:hidden">
              <MobileLoginForm />
            </div>
          </div>
        </main>
      </div>
    </AuthBackground>
  );
}
