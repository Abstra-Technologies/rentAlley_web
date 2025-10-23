"use client";
import React from "react";
import { motion } from "framer-motion";

interface LoadingContentProps {
    name?: string; // what’s being loaded (e.g. "profile", "data", etc.)
    size?: number; // optional spinner size (default 24)
}

export default function LoadingContent({ name = "content", size = 24 }: LoadingContentProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8">
            {/* Animated spinner */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "linear",
                }}
                className="inline-block mb-3"
            >
                <div
                    style={{ width: size, height: size }}
                    className="border-4 border-gray-200 border-t-blue-600 rounded-full"
                ></div>
            </motion.div>

            {/* Animated text */}
            <motion.p
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm sm:text-base text-gray-600 font-medium tracking-wide"
            >
                Loading <span className="text-blue-600 font-semibold">{name}</span>...
            </motion.p>
        </div>
    );
}
