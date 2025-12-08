"use client";

import { Suspense } from "react";
import Image from "next/image";
import Page_footer from "../../../../components/navigation/page_footer";
import LoadingScreen from "@/components/loadingScreen";
import DesktopRegisterForm from "@/components/authentication/DesktopRegisterForm";
import MobileRegisterForm from "@/components/authentication/MobileRegisterForm";

export default function RegisterPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading registration..." />}>
            <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">
                <Image
                    src="/images/hero-section.jpeg"
                    alt="UpKyp background"
                    fill
                    className="object-cover brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-emerald-800/70 to-emerald-600/70" />

                <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center flex-1 px-4 sm:px-8 py-10 gap-6 lg:gap-12">
                    {/* Hero Text - Desktop */}
                    <div className="hidden lg:block text-white max-w-lg text-center lg:text-left space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold leading-tight drop-shadow-lg">
                            Property Management Made Simple
                        </h1>
                        <p className="text-base sm:text-lg text-blue-50/90">
                            Create your account and experience seamless property management with automated billing and smart tenant tools.
                        </p>
                    </div>

                    {/* Only show Desktop form on lg+ */}
                    <div className="hidden lg:block">
                        <DesktopRegisterForm />
                    </div>

                    {/* Only show Mobile form on smaller screens */}
                    <div className="block lg:hidden">
                        <MobileRegisterForm />
                    </div>
                </main>

                <Page_footer />
            </div>
        </Suspense>
    );
}
