"use client";

import { Building2, Users, TrendingUp, Shield } from "lucide-react";
import { motion } from "motion/react";

export default function StatsSection() {
  const stats = [
    {
      value: "500+",
      label: "Properties Managed",
      icon: <Building2 className="w-6 h-6" />,
    },
    {
      value: "200+",
      label: "Active Landlords",
      icon: <Users className="w-6 h-6" />,
    },
    {
      value: "₱10M+",
      label: "Rent Processed",
      icon: <TrendingUp className="w-6 h-6" />,
    },
    { value: "99.9%", label: "Uptime", icon: <Shield className="w-6 h-6" /> },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-emerald-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 text-white mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-white/70 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
