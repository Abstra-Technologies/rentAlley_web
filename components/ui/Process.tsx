"use client";

import { useEffect, useState } from "react";
import { Home, CreditCard, Wrench, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function AnimatedFeaturesPopLoop() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const features = [
    {
      icon: <Home className="w-10 h-10" />,
      title: "Property Listings",
      description:
        "Discover verified properties with detailed information and virtual tours",
      gradient: "from-blue-500 to-blue-600",
      lightGradient: "from-blue-50 to-blue-100",
      glowColor: "shadow-blue-500/20",
    },
    {
      icon: <Wrench className="w-10 h-10" />,
      title: "Property Management",
      description:
        "Streamline operations with smart tools for maintenance and tenant communication",
      gradient: "from-purple-500 to-purple-600",
      lightGradient: "from-purple-50 to-purple-100",
      glowColor: "shadow-purple-500/20",
    },
    {
      icon: <CreditCard className="w-10 h-10" />,
      title: "Secure Payments",
      description:
        "Handle rent and utilities with automated billing and secure transactions",
      gradient: "from-emerald-500 to-emerald-600",
      lightGradient: "from-emerald-50 to-emerald-100",
      glowColor: "shadow-emerald-500/20",
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white"></div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Platform Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful tools designed to make rental management seamless
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => {
            const animateProps = reducedMotion
              ? {}
              : {
                  y: [0, -12, 0],
                  scale: [1, 1.03, 1],
                };

            const transitionProps = reducedMotion
              ? {}
              : {
                  duration: 1.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.8,
                  delay: index * 0.35,
                };

            return (
              <motion.div
                key={index}
                animate={animateProps}
                transition={transitionProps}
                className="group relative"
                aria-hidden={reducedMotion ? "false" : "true"}
              >
                {/* Card */}
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 h-full">
                  {/* Background Gradient on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.lightGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon Container */}
                    <div className="relative mb-6">
                      <div
                        className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} text-white rounded-2xl shadow-lg ${feature.glowColor} group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}
                      >
                        {feature.icon}
                      </div>
                      {/* Glow effect */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                      ></div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative corner accent */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-5 transform rotate-12 translate-x-8 -translate-y-8 group-hover:opacity-10 transition-opacity duration-500`}
                  ></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom decorative line */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600"
                style={{
                  animation: `pulse 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
