"use client";

import { useEffect, useState } from "react";
import { Shield, Home, CheckCircle } from "lucide-react";
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
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Properties",
      description: "Every listing is verified for authenticity and accuracy",
    },
    {
      icon: <Home className="w-8 h-8" />,
      title: "Instant Booking",
      description: "Book your ideal home in minutes with our streamlined process",
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Transparent Pricing",
      description: "No hidden fees. See complete pricing details upfront",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-start">
          {features.map((feature, index) => {
            // Continuous "pop" animation (vertical + subtle scale)
            const animateProps = reducedMotion
              ? {}
              : {
                  y: [0, -12, 0], // pop up then settle
                  scale: [1, 1.03, 1], // subtle scale
                };

            const transitionProps = reducedMotion
              ? {}
              : {
                  duration: 1.8, // slow pop
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.8, // pause between repeats
                  delay: index * 0.35, // step-by-step stagger
                };

            return (
              <motion.div
                key={index}
                animate={animateProps}
                transition={transitionProps}
                className="text-center"
                aria-hidden={reducedMotion ? "false" : "true"}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-2xl mb-4 shadow-lg">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
