"use client";

import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading…" }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">

            {/* BACKGROUND IMAGE (VERY SUBTLE) */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-[1.02]"
                style={{
                    backgroundImage:
                        "url('https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg')",
                }}
            />

            {/* PRIMARY WHITE WASH (dominant) */}
            <div className="absolute inset-0 bg-white/50" />

            {/* SOFT DEPTH GRADIENT (barely visible) */}
            <div
                className="absolute inset-0 bg-gradient-to-br
          from-blue-50/25 via-white/15 to-emerald-50/25"
            />

            {/* CENTER CONTENT */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">

                {/* LOGO */}
                <motion.div
                    className="relative mb-6"
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.96, 1, 0.96],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <img
                        src="/upkeep_blue.png"
                        alt="Upkyp"
                        className="
              w-[clamp(4rem,9vw,5.75rem)]
              h-[clamp(4rem,9vw,5.75rem)]
              object-contain
              drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)]
            "
                    />

                    {/* HALO (SOFT, NOT FLASHY) */}
                    <motion.div
                        className="absolute inset-0 -z-10 rounded-full blur-3xl
                       bg-gradient-to-br from-blue-400 to-emerald-400"
                        animate={{
                            opacity: [0.15, 0.28, 0.15],
                            scale: [1, 1.18, 1],
                        }}
                        transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </motion.div>

                {/* BRAND */}
                <motion.h1
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl sm:text-2xl typographica font-semibold text-gray-900 tracking-tight mb-4"
                >
                    Upkyp
                    <span className="block mt-1 text-sm sm:text-base font-medium text-gray-500">
    Connect More. Manage Less.
  </span>
                </motion.h1>


                {/* LOADING TEXT */}
                <motion.p
                    className="text-xs sm:text-sm text-gray-600 font-medium"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                >
                    {message}
                </motion.p>
            </div>

            {/* FOOTER BRANDING */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-6 z-10 flex flex-col items-center gap-1"
            >
                <img
                    src="https://res.cloudinary.com/dptmeluy0/image/upload/v1764504569/abstra_dark_rvu7id.png"
                    alt="Abstra Technologies"
                    className="w-28 opacity-70"
                />
                <p className="text-[11px] text-gray-500 font-medium">
                    Property Management Platform
                </p>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
