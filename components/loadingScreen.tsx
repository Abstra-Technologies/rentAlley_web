"use client";

import { motion } from "framer-motion";
import { HomeIcon } from "lucide-react";

const LoadingScreen = ({ message = "Fetching properties..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 px-4">
      {/* Animated Home Icon */}
      <motion.div
        initial={{ y: 0, scale: 0.95 }}
        animate={{ y: [0, -12, 0], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <img
          src="/upkeep.png"
          alt="UpKeep Logo"
          className="w-24 h-24 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain rounded-lg drop-shadow-2xl select-none"
        />

        <motion.span
          className="absolute inset-0 rounded-full bg-white opacity-25 blur-2xl"
          animate={{ scale: [1, 1.4, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* App Name */}
      <motion.h1
        className="mt-6 typographica text-6xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-wide drop-shadow-lg select-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        UpKyp
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-2 text-white/95 text-lg sm:text-xl md:text-2xl text-center max-w-xl font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        "Manage less. Live more."
      </motion.p>

      {/* Dynamic Message */}
      <motion.p
        className="mt-4 text-white/90 text-sm sm:text-base italic font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>

      {/* Animated Gradient Loading Bar */}
      <motion.div
        className="mt-6 w-40 sm:w-60 md:w-80 h-2 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-white via-emerald-200 to-white rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </div>
  );
};

export default LoadingScreen;
