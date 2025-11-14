"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader,
  ArrowRight,
  CheckCircle,
  MapPin,
  Home,
  Shield,
} from "lucide-react";
import Footer from "../components/navigation/footer";
import LoadingScreen from "@/components/loadingScreen";
import UnitCard from "../components/find-rent/UnitCard";
import HeroText from "@/components/ui/hero";
import AnimatedFeatures from "@/components/ui/Process";

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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
    <div className="relative overflow-hidden select-none">

  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center select-none"
    style={{
      backgroundImage:
        "url('https://res.cloudinary.com/dptmeluy0/image/upload/v1763083980/dd3b4bfd-cc30-46c5-8320-b2aaf85dd4bd_pe97mw.jpg')",
    }}
  />

  {/* Lighter Gradient Overlay (new) */}
  <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-neutral-800/50 to-black/60"></div>

  {/* Soft Glow Circles */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
  </div>

  {/* Content */}
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32 pb-20 sm:pb-32">
    <div className="text-center max-w-4xl mx-auto">

      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
        <Shield className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">
          Verified Listings • Smart Property Management
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-md">
        Manage and Discover Rental Properties in One Platform
      </h1>

      <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow">
        Explore trusted listings and streamline property operations—from tenant
        management to billing—all in a single, easy-to-use system.
      </p>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter city or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-base text-gray-900 placeholder-gray-400 bg-transparent"
            />
          </div>

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap"
          >
            <Search className="w-5 h-5" />
            Search Properties
          </button>
        </div>
      </form>

      {/* Popular Searches */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-white/70">Popular:</span>
        {["Manila", "Quezon City", "Makati", "Taguig"].map((city) => (
          <button
            key={city}
            onClick={() => router.push(`/pages/find-rent?searchQuery=${city}`)}
            className="px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all"
          >
            {city}
          </button>
        ))}
      </div>

    </div>
  </div>
</div>


      <section>
       <AnimatedFeatures/> 
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hand-selected homes that meet our highest standards
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : featuredUnits.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No properties available
              </h3>
              <p className="text-gray-600">
                New listings coming soon. Check back shortly!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
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

          <div className="text-center">
            <Link
              href="/pages/find-rent"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View All Properties
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Join Our Growing Community of Happy Renters
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Upkyp is building a trusted rental network in the Philippines
                with verified listings, transparent pricing, and reliable
                support for both tenants and landlords.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { value: "✔", label: "Verified Properties" },
                  { value: "💬", label: "Transparent Pricing" },
                  { value: "🤝", label: "Exceptional Support" },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link
                href="/pages/about-us"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Learn More About Us
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/aboutrent.jpeg"
                alt="Happy renters"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Recently Added
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fresh listings added daily from verified landlords
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : recentUnits.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No recent listings
              </h3>
              <p className="text-gray-600">
                New properties are added regularly
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
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

          <div className="text-center">
            <Link
              href="/pages/find-rent"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Explore All Listings
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands discovering their perfect rental on Upkyp
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pages/find-rent"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Searching
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pages/auth/selectRole"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
