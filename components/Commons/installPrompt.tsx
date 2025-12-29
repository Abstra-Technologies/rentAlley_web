"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissed = sessionStorage.getItem("installPromptDismissed");
      if (!dismissed) {
        // Delay so it doesn't appear immediately
        setTimeout(() => setShowPrompt(true), 2500);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ User accepted the install prompt");
    } else {
      console.log("❌ User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    setIsInstalling(false);
    sessionStorage.setItem("installPromptDismissed", "true");
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("installPromptDismissed", "true");
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Desktop Version - Bottom LEFT to avoid FeedbackWidget on right */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="hidden sm:block fixed bottom-6 left-6 z-[90]"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-80 overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-600" />

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Install UpKyp
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Add to home screen for quick access.
                  </p>
                </div>
              </div>

              {/* Features */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Faster access</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span>Smooth navigation</span>
                    </div>
                </div>


                {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Install
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile Version - Top Banner (avoids bottom FABs) */}
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="sm:hidden fixed top-0 left-0 right-0 z-[90] safe-area-top"
          >
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Install UpKyp App
                  </p>
                  <p className="text-xs text-white/80">
                    Quick access from home screen
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleDismiss}
                    className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-100 transition-all shadow disabled:opacity-70 flex items-center gap-2"
                  >
                    {isInstalling ? (
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      "Install"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
