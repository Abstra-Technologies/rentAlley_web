"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("✅ User accepted the install prompt");
        } else {
            console.log("❌ User dismissed the install prompt");
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
        sessionStorage.setItem("installPromptDismissed", "true");
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem("installPromptDismissed", "true");
    };

    // Prevent re-showing once dismissed in this session
    useEffect(() => {
        const dismissed = sessionStorage.getItem("installPromptDismissed");
        if (dismissed) setShowPrompt(false);
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto bg-white/80 backdrop-blur-md border border-emerald-100 shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-slide-up z-50">
            <div className="flex items-center gap-2 text-gray-700">
                <Download className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium">
          Install <span className="font-semibold text-emerald-700">UpKyp</span> for a better experience.
        </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleInstallClick}
                    className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                    Install
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Animation */}
            <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}