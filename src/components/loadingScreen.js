"use client";

import { motion } from "framer-motion";

const LoadingScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-violet-500">
            <motion.div
                className="w-16 h-16 bg-white"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            <motion.h1
                className="mt-5 text-3xl font-bold text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                Rentahan
            </motion.h1>

            <motion.p
                className="mt-2 text-white text-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
            >
                Making rental management easier and hassle-free.
            </motion.p>
        </div>
    );
};

export default LoadingScreen;
