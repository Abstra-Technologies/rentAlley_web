"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600"></div>

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20"></div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/20">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">
            Start Your Journey
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Ready to Find Your
          <span className="block mt-2 bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
            Dream Home?
          </span>
        </h2>

        <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-light">
          Start your rental journey with Upkyp today
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pages/find-rent"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold text-lg rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10">Start Searching</span>
            <ArrowRight className="relative z-10 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>

          <Link
            href="/pages/auth/selectRole"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/50 text-white font-bold text-lg rounded-2xl hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            List Your Property
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
