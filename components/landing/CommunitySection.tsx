

"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";
import { COMMUNITY_FEATURES } from "@/constant/landing";

export default function CommunitySection() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 via-blue-900 to-emerald-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      {/* Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-white order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
              <Users className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-semibold text-white">
                Built for the Community
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              A Modern Approach to
              <span className="block mt-2 bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
                Property Management
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed">
              We're building a trusted rental platform for the Philippines with
              verified listings, transparent pricing, and reliable support for
              both tenants and landlords.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {COMMUNITY_FEATURES.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${item.color} rounded-xl shadow-lg hover:scale-105 transition-transform duration-300`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-white">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/pages/about-us"
              className="group inline-flex items-center gap-3 text-emerald-300 hover:text-emerald-200 font-semibold text-lg transition-colors"
            >
              Learn Our Story
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative h-80 sm:h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent z-10"></div>
              <Image
                src="/images/rent-point.jpeg"
                alt="Happy renters"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
