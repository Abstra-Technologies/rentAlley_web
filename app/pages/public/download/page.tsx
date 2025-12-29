"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import Image from "next/image";

export default function DownloadPage() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Detect if app is already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsPWAInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            setIsPWAInstalled(true);
        }

        setDeferredPrompt(null);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
            {/* FULL IMAGE BACKGROUND */}
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

                    {isPWAInstalled ? (
                        <p className="text-emerald-300 font-semibold">
                            ✅ App already installed
                        </p>
                    ) : deferredPrompt ? (
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
                            Install App
                        </button>
                    ) : (
                        <p className="text-white/80 text-sm">
                            Open this site in your browser to install the app.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
