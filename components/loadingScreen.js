"use client";

import { motion } from "framer-motion";
import { HomeIcon } from "lucide-react";

const LoadingScreen = ({ message = "Fetching properties..." }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-800 to-blue-600 px-4">
            {/* Animated Home Icon with Glow */}
            <motion.div
                initial={{ y: 0, scale: 0.95 }}
                animate={{ y: [0, -12, 0], scale: [0.95, 1.05, 0.95] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="relative"
            >
                <HomeIcon className="w-16 h-16 text-white drop-shadow-lg" />

                {/* Glowing aura */}
                <motion.span
                    className="absolute inset-0 rounded-full bg-white opacity-20 blur-xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>



            {/* App Name */}
            <motion.h1
                className="mt-6 text-4xl font-extrabold text-white tracking-wide drop-shadow"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                Hestia
            </motion.h1>

            {/* Tagline */}
            <motion.p
                className="mt-2 text-white/90 text-lg text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
            >
                Making rental management easier and hassle-free.
            </motion.p>

            {/* Dynamic Message */}
            <motion.p
                className="mt-4 text-white/80 text-sm italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {message}
            </motion.p>

            {/* Animated Gradient Loading Bar */}
            <motion.div
                className="mt-6 w-40 h-2 rounded-full bg-gradient-to-r from-blue-300 to-blue-100 overflow-hidden"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1] }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <motion.div
                    className="h-full w-full bg-gradient-to-r from-white/70 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
