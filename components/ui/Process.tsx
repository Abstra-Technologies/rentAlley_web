"use client";

import { useEffect, useState } from "react";
import { Home, CreditCard, Wrench } from "lucide-react";
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
            icon: <Home className="w-8 h-8" />,
            title: "Listing Properties",
            description: "Explore available properties easily and efficiently",
        },
        {
            icon: <Wrench className="w-8 h-8" />,
            title: "Property Management",
            description: "Easily handle property-related tasks and requests",
        },
        {
            icon: <CreditCard className="w-8 h-8" />,
            title: "Tenant Billing",
            description: "Pay rent and utilities securely and conveniently",
        },
    ];


    return (
        <section className="py-16 sm:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 items-start">
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
