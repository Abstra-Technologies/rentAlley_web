"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import Image from "next/image";

/* ===============================
   PLATFORM HELPERS
================================ */
const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const isStandalone = () => {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS standalone
        (window.navigator as any).standalone === true
    );
};

/* ===============================
   PAGE
================================ */
export default function DownloadPage() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    /* -------------------------------
       INSTALL PROMPT HANDLING
    -------------------------------- */
    useEffect(() => {
        if (isStandalone()) {
            setIsPWAInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    /* -------------------------------
       INSTALL HANDLER
    -------------------------------- */
    const handleInstall = async () => {
        // iOS: installation is manual (instructions shown)
        if (isIOS()) return;

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            setIsPWAInstalled(true);
        }

        setDeferredPrompt(null);
    };

    /* ===============================
       RENDER
================================ */
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
            {/* BACKGROUND IMAGE */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="UpKyp background"
                fill
                className="object-cover"
                priority
            />

            {/* CONTENT */}
            <div className="relative z-10 w-full max-w-md text-center">
                <div
                    className="rounded-2xl p-10 shadow-2xl
                               bg-white/10 backdrop-blur-lg
                               border border-white/20"
                >
                    <Smartphone className="w-16 h-16 mx-auto mb-4 text-white" />

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Download UpKyp
                    </h1>

                    <p className="text-sm text-white/90 mb-6">
                        Install the UpKyp app to manage your rentals anytime,
                        anywhere. Works on mobile and desktop.
                    </p>

                    {/* INSTALL STATE */}
                    {isPWAInstalled ? (
                        <p className="text-emerald-300 font-semibold">
                            ✅ App already installed
                        </p>
                    ) : (
                        <>
                            <button
                                onClick={handleInstall}
                                className="mx-auto flex items-center justify-center gap-2
                                           px-6 py-3 rounded-lg
                                           bg-emerald-500 text-white font-medium
                                           shadow-lg transition-all
                                           hover:bg-emerald-600 hover:scale-105
                                           active:scale-95"
                            >
                                <Download className="w-5 h-5" />
                                Download App Now
                            </button>

                            {/* iOS INSTRUCTIONS */}
                            {isIOS() && (
                                <div className="mt-4 text-sm text-white/90 space-y-1">
                                    <p className="font-medium">
                                        How to install on iPhone:
                                    </p>
                                    <p>
                                        Tap{" "}
                                        <span className="underline">
                                            Share
                                        </span>{" "}
                                        →{" "}
                                        <span className="underline">
                                            Add to Home Screen
                                        </span>
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
