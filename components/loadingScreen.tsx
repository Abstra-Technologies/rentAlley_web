"use client";

import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center w-full h-screen bg-white select-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 opacity-60" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="relative">
              <img
                src="/upkeep_blue.png"
                alt="Upkyp"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />

              {/* Very subtle glow */}
              <div className="absolute inset-0 blur-xl opacity-20 bg-gradient-to-br from-blue-500 to-emerald-500" />
            </div>
          </motion.div>
        </motion.div>

        {/* Company name - clean typography */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-8 tracking-tight"
        >
          Upkyp
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Simplified progress bar */}
          <div className="w-48 sm:w-56 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.5,
              }}
            />
          </div>

          {/* Message - subtle and clean */}
          <motion.p
            className="text-sm text-gray-500 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {message}
          </motion.p>
        </motion.div>
      </div>

      {/* Optional: Very subtle bottom branding - Vercel style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center"
      >
        <p className="text-xs text-gray-400 font-medium">
          Property Management Platform
        </p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
