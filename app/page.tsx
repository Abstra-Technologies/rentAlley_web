"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader, ArrowRight } from "lucide-react";
import Footer from "../components/navigation/footer";
import LoadingScreen from "@/components/loadingScreen";
import UnitCard from "../components/find-rent/UnitCard";
import HeroText from "@/components/ui/hero";

interface Unit {
  unit_id: string;
  property_id: string;
  property_name: string;
  unit_name: string;
  property_type: string;
  property_photo: string;
  photos: string[];
  city: string;
  province: string;
  rent_amount: number;
  unit_size: number;
  bed_spacing: number;
  furnish: string;
  avail_beds: number;
  flexipay_enabled: number;
}

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function SplashScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [featuredUnits, setFeaturedUnits] = useState<Unit[]>([]);
  const [recentUnits, setRecentUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function redirectIfAuthenticated() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          console.log("User type detected:", data.userType);

          switch (data.userType) {
            case "tenant":
              router.replace("/pages/tenant/my-unit");
              return;
            case "landlord":
              router.replace("/pages/landlord/dashboard");
              return;
            case "admin":
              router.replace("/pages/admin/dashboard");
              return;
            default:
              router.replace("/pages/auth/login");
              return;
          }
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCheckingAuth(false);
      }
    }

    redirectIfAuthenticated();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      try {
        setLoading(true);
        const res = await fetch("/api/properties/findRent/units");
        if (!res.ok) throw new Error("Failed to fetch units");

        const data = await res.json();

        if (data?.data && Array.isArray(data.data)) {
          setFeaturedUnits(data.data.slice(0, 3));
          setRecentUnits(data.data.slice(0, 6));
        } else {
          setFeaturedUnits([]);
          setRecentUnits([]);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
        setFeaturedUnits([]);
        setRecentUnits([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUnits();
  }, []);

  if (checkingAuth) {
    return <LoadingScreen />;
  }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/pages/find-rent?searchQuery=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Hero Section */}
      <div className="relative min-h-screen sm:min-h-[600px] lg:h-[700px] w-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-section.jpeg"
            alt="Cityscape"
            fill
            className="object-cover brightness-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between sm:justify-center items-center px-4 py-8 sm:py-12">
          {/* Main Heading */}
          <div className="w-full max-w-4xl text-center mt-12 sm:mt-0">
            <HeroText />

          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-4xl mt-8 sm:mt-12 px-4 sm:px-0"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
              <div className="flex flex-col sm:flex-row gap-0">
                <div className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-white">
                  <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by location, property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full outline-none text-sm sm:text-base text-gray-900 placeholder-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-6 py-3 sm:py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Links */}
          <div className="mt-8 sm:mt-10 flex flex-wrap gap-2 justify-center px-4">
            {["Manila", "Quezon", "Taguig", "Makati"].map((city) => (
              <button
                key={city}
                onClick={() =>
                  router.push(`/pages/find-rent?searchQuery=${city}`)
                }
                className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-white/30 transition-all active:scale-95"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Units Section */}
      <section className="py-8 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Units
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Handpicked homes perfect for you
              </p>
            </div>
            <Link
              href="/pages/find-rent"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-emerald-600 font-semibold transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : featuredUnits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-blue-100 p-8 sm:p-12 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No units available
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Check back soon for featured listings
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredUnits.map((unit) => (
                <UnitCard
                  key={unit.unit_id}
                  unit={unit}
                  onClick={() =>
                    router.push(
                      `/pages/find-rent/${unit.property_id}/${unit.unit_id}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-8 sm:py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center">
            <div className="text-white order-2 lg:order-1">
              <p className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2 sm:mb-3">
                About Upkyp
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
                Find Your Dream Property Today
              </h2>
              <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                Upkyp connects you with verified rental units across the
                Philippines. We make property hunting simple, transparent, and
                stress-free.
              </p>
              <Link
                href="/pages/about-us"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden order-1 lg:order-2 shadow-xl">
              <Image
                src="/images/aboutrent.jpeg"
                alt="Properties"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Added Units Section */}
      <section className="py-8 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Recently Added
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Latest units on Upkyp
              </p>
            </div>
            <Link
              href="/pages/find-rent"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-emerald-600 font-semibold transition-colors"
            >
              Explore All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : recentUnits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-blue-100 p-8 sm:p-12 text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No units available
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                New listings coming soon
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentUnits.map((unit) => (
                <UnitCard
                  key={unit.unit_id}
                  unit={unit}
                  onClick={() =>
                    router.push(
                      `/pages/find-rent/${unit.property_id}/${unit.unit_id}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 px-4 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Ready to find your perfect home?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-6 sm:mb-8">
            Join thousands of renters finding verified units on Upkyp
          </p>
          <Link
            href="/pages/find-rent"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all active:scale-95"
          >
            Start Searching
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
