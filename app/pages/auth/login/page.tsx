"use client";

import { Suspense } from "react";
import Image from "next/image";
import Page_footer from "../../../../components/navigation/page_footer";
import LoadingScreen from "@/components/loadingScreen";
import LoginForm from "@/components/authentication/loginForm";
import MobileLoginForm from "@/components/authentication/mobileLoginForm";

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading authentication..." />}>
            <Login />
        </Suspense>
    );
}

function Login() {
    return (
        <div className="relative flex flex-col min-h-[115vh] bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">

            {/* Background */}
            <Image
                src="/images/hero-section.jpeg"
                alt="UpKyp background"
                fill
                priority
                className="object-cover brightness-75"
                sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-emerald-800/70 to-emerald-600/70" />

            {/* Main Section */}
            <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center flex-1 px-4 sm:px-6 py-20 lg:py-28 gap-6 lg:gap-10">
                {/* Hero Text (Desktop only) */}
                <div className="hidden lg:block text-white max-w-lg text-center lg:text-left space-y-4">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow-lg">
                        Your Property Journey, Simplified.
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400 mt-2">
      Upkyp
    </span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-base text-gray-100">
                        From browsing to billing, Upkyp keeps your rentals organized and hassle-free.
                    </p>
                </div>



                {/* Desktop Login Form */}
                <div className="hidden sm:block">
                    <LoginForm />
                </div>

                {/* Mobile Login Form */}
                <div className="sm:hidden">
                    <MobileLoginForm />
                </div>
            </main>

            <Page_footer />
        </div>
    );
}
