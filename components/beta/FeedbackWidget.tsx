"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HIDDEN_ROUTES = [
  "/pages/tenant/chat",
  "/pages/landlord/chat",
  "/pages/landlord/messages",
  "/pages/admin/chat",
  "/pages/tenant/rentalPortal",
  "/pages/tenant/kypId",
  "/pages/find-rent",
  "/pages/landlord/properties",
];

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();

  // Check if widget should be hidden on current route
  useEffect(() => {
    const shouldHide = HIDDEN_ROUTES.some((route) =>
      pathname?.startsWith(route)
    );
    setIsVisible(!shouldHide);

    // Close popup when navigating
    setIsOpen(false);
  }, [pathname]);

  const handleOpenFeedback = () => {
    window.open("https://tally.so/r/ODldbg", "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  // Don't render on hidden routes
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-2xl p-4 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Give feedback"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse indicator when closed */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          </span>
        )}
      </motion.button>

      {/* Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-4">
              <h3 className="font-bold text-lg text-white">
                We'd love your feedback!
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Help us improve Upkyp Beta
              </p>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Your thoughts matter! Click below to open our quick feedback
                form. It takes less than a minute.
              </p>

              <button
                onClick={handleOpenFeedback}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                Open Feedback Form
                <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <p className="text-xs text-center mt-4 text-gray-400">
                Powered by Tally
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
