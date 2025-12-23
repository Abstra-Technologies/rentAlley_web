"use client";

import {
  Smartphone,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

export default function PhilippineMarketSection() {
  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Local Payment Tracking",
      description:
        "Track GCash, bank transfers, and cash payments. We understand how Filipino tenants actually pay rent.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Philippine Billing Context",
      description:
        "Monthly, advance, and deposit tracking. Support for post-dated checks and the billing cycles common in the PH market.",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Fully Mobile Responsive",
      description:
        "Access your dashboard anywhere—desktop, tablet, or phone. Manage properties whether you're at home or on the go.",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Built for Real Challenges",
      description:
        "Features designed around actual landlord pain points—not generic property management from abroad.",
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                Built with the Philippine Market in Mind
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Understanding Your
              <span className="block mt-1 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Real Needs
              </span>
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Not a one-size-fits-all solution. UpKyp is designed around the
              actual challenges landlords face.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="relative bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                {/* Icon */}
                <div
                  className={`mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                >
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-center"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white">
            <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-lg mb-1">
                Purpose-Built for Landlords
              </div>
              <div className="text-white/90">
                Features designed around real challenges—from payment tracking
                to tenant communication.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
