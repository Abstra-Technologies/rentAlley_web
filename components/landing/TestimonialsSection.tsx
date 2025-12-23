"use client";

import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Landlord, 8 Units",
      location: "Quezon City",
      content:
        "Before UpKyp, I was using a notebook and Viber groups to manage everything. Now I can see all my properties, tenants, and payments in one dashboard. Game changer!",
      avatar: null, // placeholder
    },
    {
      name: "Roberto Cruz",
      role: "Property Investor",
      location: "Cebu City",
      content:
        "The billing automation alone saved me hours every month. My tenants love the portal too—they can pay and submit maintenance requests without calling me.",
      avatar: null,
    },
    {
      name: "Anna Reyes",
      role: "Landlord, 15 Units",
      location: "Makati",
      content:
        "Finally, a property management system that understands the Philippine market. The support team is responsive and they actually listen to feedback.",
      avatar: null,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full mb-5">
              <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                Trusted by Landlords
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join hundreds of Filipino landlords who've simplified their
              property management.
            </p>
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 lg:p-8 border border-gray-200 h-full">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-blue-200 mb-4" />

                {/* Content */}
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
