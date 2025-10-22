
"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

export default function DownloadPage() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Detect if app is already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsPWAInstalled(true);
        }

        // Capture beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === "accepted") {
                console.log("PWA installed");
                setIsPWAInstalled(true);
            }
            setDeferredPrompt(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 via-teal-700 to-emerald-600 text-white p-6">

            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-10 max-w-md text-center items-center justify-center">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                <h1 className="text-2xl font-bold mb-2">Download UpKyp</h1>
                <p className="text-sm text-gray-200 mb-6">
                    Install our app to manage your rentals anytime, anywhere. Works on mobile and desktop!
                </p>

                {isPWAInstalled ? (
                    <p className="text-emerald-300 font-semibold">✅ App already installed</p>
                ) : deferredPrompt ? (
                    <div className="flex justify-center">
                        <button
                            onClick={handleInstall}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 justify-center text-white rounded-lg shadow-lg
                 hover:bg-emerald-600 transition-transform duration-300
                 animate-bounce hover:scale-105 active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            Install App
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-300 text-sm">
                        Open this site in your mobile/desktop browser to install the app.
                    </p>
                )}

            </div>
        </div>
    );
}
