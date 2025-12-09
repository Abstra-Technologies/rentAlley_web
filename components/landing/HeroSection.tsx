"use client";

import { FormEvent } from "react";
import { Search, MapPin, Shield } from "lucide-react";
import { POPULAR_CITIES, TRUST_INDICATORS } from "@/constant/landing";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: (e: FormEvent<HTMLFormElement>) => void;
  router: any;
}

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  handleSearch,
  router,
}: HeroSectionProps) {
  return (
    <div className="relative min-h-[85vh] sm:min-h-[90vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dptmeluy0/image/upload/v1763083980/dd3b4bfd-cc30-46c5-8320-b2aaf85dd4bd_pe97mw.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-blue-800/90 to-emerald-900/95"></div>
        <AnimatedBackground />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 sm:pb-20">
        <div className="text-center max-w-5xl mx-auto">
          <HeroBadge />
          <HeroHeadline />
          <HeroDescription />
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />
          <PopularSearches router={router} />
          <TrustIndicators />
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-20 w-96 h-96 bg-emerald-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-purple-500/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full mb-8 border border-white/20 shadow-2xl animate-fade-in">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
      <Shield className="w-4 h-4 text-white" />
      <span className="text-sm font-semibold text-white">
        Verified Listings • Secure Platform
      </span>
    </div>
  );
}

function HeroHeadline() {
  return (
    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] animate-slide-up">
      <span className="block mb-2">Find Your Perfect</span>
      <span className="relative inline-block">
        <span className="relative z-10 bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
          Rental Home
        </span>
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-purple-400/20 blur-2xl"></div>
      </span>
    </h1>
  );
}

function HeroDescription() {
  return (
    <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-slide-up animation-delay-200">
      Discover verified listings and manage properties seamlessly—all in one
      powerful platform
    </p>
  );
}

function SearchBar({ searchQuery, setSearchQuery, handleSearch }: any) {
  return (
    <form
      onSubmit={handleSearch}
      className="max-w-4xl mx-auto mb-10 animate-slide-up animation-delay-400"
    >
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-white/50 rounded-xl transition-all hover:bg-white/70">
            <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 animate-pulse" />
            <input
              type="text"
              placeholder="Search by city or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-base sm:text-lg text-gray-900 placeholder-gray-400 bg-transparent font-medium"
            />
          </div>
          <button
            type="submit"
            className="group/btn relative px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
            <Search className="w-5 h-5 relative z-10 group-hover/btn:rotate-12 transition-transform" />
            <span className="relative z-10">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function PopularSearches({ router }: any) {
  return (
    <div className="flex flex-wrap gap-3 justify-center items-center animate-fade-in animation-delay-600">
      <span className="text-sm text-white/60 font-medium">Popular:</span>
      {POPULAR_CITIES.map((city) => (
        <button
          key={city}
          onClick={() => router.push(`/pages/find-rent?searchQuery=${city}`)}
          className="group px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-110 hover:shadow-lg"
        >
          {city}
        </button>
      ))}
    </div>
  );
}

function TrustIndicators() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16 animate-fade-in animation-delay-800">
      {TRUST_INDICATORS.map((item, i) => (
        <div
          key={i}
          className="text-center group hover:scale-110 transition-transform duration-300"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl mb-2 border border-white/20 group-hover:bg-white/20 transition-all">
            <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            {item.text}
          </div>
          <div className="text-xs sm:text-sm text-white/60">{item.subtext}</div>
        </div>
      ))}
    </div>
  );
}
