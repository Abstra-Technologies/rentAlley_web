"use client";

import { motion } from "framer-motion";
import { HomeIcon } from "lucide-react"; // Importing Home icon from Lucide

const LoadingScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-700 to-blue-600">
            {/* Animated Home Icon */}
            <motion.div
                initial={{ rotate: 0, scale: 0.9 }}
                animate={{ rotate: 360, scale: [0.9, 1, 0.9] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <HomeIcon className="w-16 h-16 text-white" />
            </motion.div>

            {/* App Name with Fade-in */}
            <motion.h1
                className="mt-5 text-3xl font-bold text-white tracking-wide"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                Rentahan
            </motion.h1>

            {/* Tagline with Smooth Appear */}
            <motion.p
                className="mt-2 text-white text-lg opacity-80"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
            >
                Making rental management easier and hassle-free.
            </motion.p>

            {/* Loading Bar */}
            <motion.div
                className="mt-6 w-24 h-1 bg-white rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1] }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
};

export default LoadingScreen;
