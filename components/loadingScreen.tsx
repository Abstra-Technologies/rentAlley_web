"use client";

import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading…" }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white overflow-hidden">
            {/* Soft background wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />

            {/* Center Content */}
            <div className="relative z-10 flex flex-col items-center text-center">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative mb-5"
                >
                    <img
                        src="/upkeep_blue.png"
                        alt="Upkyp"
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                    />

                    {/* Soft halo */}
                    <div className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-30
            bg-gradient-to-br from-blue-400 to-emerald-400" />
                </motion.div>

                {/* Brand */}
                <motion.h1
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight mb-6"
                >
                    Upkyp
                </motion.h1>

                {/* Loader */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-3"
                >
                    {/* Minimal progress bar */}
                    <div className="w-44 sm:w-52 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                            className="h-full w-1/3 rounded-full
                bg-gradient-to-r from-blue-600 to-emerald-600"
                            animate={{ x: ["-120%", "220%"] }}
                            transition={{
                                duration: 1.4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </div>

                    {/* Status text */}
                    <motion.p
                        className="text-xs sm:text-sm text-gray-500 font-medium"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                    >
                        {message}
                    </motion.p>
                </motion.div>
            </div>

            {/* Footer branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-6 flex flex-col items-center gap-1"
            >
                <img
                    src="https://res.cloudinary.com/dptmeluy0/image/upload/v1764504569/abstra_dark_rvu7id.png"
                    alt="Abstra Technologies"
                    className="w-28 opacity-70"
                />
                <p className="text-[11px] text-gray-400 font-medium">
                    Property Management Platform
                </p>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
