"use client";

import { motion } from "framer-motion";

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center w-full h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 px-4 text-center select-none overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
                        linear-gradient(to right, white 1px, transparent 1px),
                        linear-gradient(to bottom, white 1px, transparent 1px)
                    `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Decorative Gradient Blobs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-300/20 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -30, 0],
          y: [0, 20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Content Container */}
      <div className="relative z-10">
        {/* MUCH BIGGER Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8"
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 3, 0, -3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            {/* Outer Glow Ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />

            {/* Logo Container with Shadow - MUCH BIGGER */}
            <div className="relative bg-white/10 backdrop-blur-sm p-8 sm:p-10 md:p-12 lg:p-16 rounded-3xl border border-white/20 shadow-2xl">
              <img
                src="/upkeep.png"
                alt="UpKyp Logo"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain filter drop-shadow-2xl"
              />
            </div>

            {/* Pulsing Ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-white/40"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />

            {/* Secondary Pulsing Ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border border-white/30"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
          </motion.div>
        </motion.div>

        {/* App Name with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-4"
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tight">
            <span className="inline-block bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent drop-shadow-lg">
              UpKyp
            </span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <p className="text-white/95 text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed max-w-md mx-auto px-4">
            "Connect more. Manage less."
          </p>
          <div className="mt-3 h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
        </motion.div>

        {/* Dynamic Message with Typing Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mb-10"
        >
          <motion.p
            className="text-white/90 text-base sm:text-lg md:text-xl font-medium tracking-wide px-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {message}
          </motion.p>
        </motion.div>

        {/* Enhanced Loading Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative"
        >
          {/* Bar Container */}
          <div className="relative w-64 sm:w-80 md:w-96 h-2.5 rounded-full bg-white/15 backdrop-blur-md overflow-hidden shadow-lg border border-white/20 mx-auto">
            {/* Animated Progress */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.2,
              }}
              style={{
                boxShadow: "0 0 20px rgba(255,255,255,0.5)",
              }}
            />

            {/* Secondary Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-200/50 via-white/50 to-blue-200/50"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2.5 h-2.5 rounded-full bg-white/70"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Subtle Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12 text-white/60 text-xs sm:text-sm font-light tracking-widest uppercase"
        >
          Property Management Platform
        </motion.p>
      </div>

      {/* Floating Particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
          style={{
            left: `${10 + i * 9}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default LoadingScreen;
