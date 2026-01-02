"use client";

import { Suspense } from "react";
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
        <div
            className="relative min-h-screen bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage:
                    "url('https://res.cloudinary.com/dptmeluy0/image/upload/v1767326297/f2aa6c44-eb73-41ea-9d68-5c11237a7cd5_uwielr.jpg')",
            }}
        >
            {/* VERY light black overlay */}
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 py-12 gap-12 lg:gap-20">

                    {/* Hero Text */}
                    <div className="hidden lg:block max-w-lg text-center lg:text-left space-y-5">
                        <h1
                            className="text-4xl sm:text-5xl font-extrabold leading-tight text-white"
                            style={{
                                textShadow:
                                    "0 2px 4px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.25)",
                            }}
                        >
                            Your Property Journey, Simplified.
                            <span
                                className="block mt-2 typographica font-extrabold"
                                style={{
                                    color: "#FFF95B",
                                    textShadow: "0 1px 4px rgba(0,0,0,0.35)",
                                }}
                            >
                          Upkyp
                        </span>


                        </h1>

                        <p
                            className="text-lg text-gray-100"
                            style={{
                                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                            }}
                        >
                            From browsing to billing, Upkyp keeps your rentals organized and
                            hassle-free.
                        </p>
                    </div>

                    {/* Forms */}
                    <div className="w-full max-w-md">
                        <div className="hidden sm:block">
                            <LoginForm />
                        </div>
                        <div className="sm:hidden">
                            <MobileLoginForm />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
