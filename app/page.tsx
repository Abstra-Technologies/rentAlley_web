// File: /app/page.tsx (or wherever your landing page is)

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Page_footer from "@/components/navigation/page_footer";
import LoadingScreen from "@/components/loadingScreen";
import AnimatedFeatures from "@/components/ui/Process";
import HeroSection from "@/components/landing/HeroSection";
import PropertiesSection from "@/components/landing/PropertiesSection";
import CommunitySection from "@/components/landing/CommunitySection";
import CTASection from "@/components/landing/CTASection";
import { Unit } from "@/types/landing";
import "@/app/styles/landing-animations.css";

export default function SplashScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [featuredUnits, setFeaturedUnits] = useState<Unit[]>([]);
  const [recentUnits, setRecentUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication and redirect if logged in
  useEffect(() => {
    async function redirectIfAuthenticated() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const routes = {
            tenant: "/pages/tenant/my-unit",
            landlord: "/pages/landlord/dashboard",
            admin: "/pages/admin/dashboard",
          };
          router.replace(
            routes[data.userType as keyof typeof routes] || "/pages/auth/login"
          );
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
      setCheckingAuth(false);
    }
    redirectIfAuthenticated();
  }, [router]);

  // Fetch property units
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
        }
      } catch (error) {
        console.error("Error fetching units:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUnits();
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/pages/find-rent?searchQuery=${encodeURIComponent(searchQuery)}`
      );
    }
  };

  if (checkingAuth) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        router={router}
      />

      {/* Features Section */}
      <section className="bg-white relative -mt-8">
        <AnimatedFeatures />
      </section>

      {/* Featured Properties */}
      <PropertiesSection
        title="Featured Properties"
        description="Hand-selected homes that meet our highest standards"
        badgeText="Featured Listings"
        units={featuredUnits}
        loading={loading}
        router={router}
        emptyTitle="No Properties Available Yet"
        emptyDescription="New listings coming soon. Check back shortly!"
      />

      {/* Community Section */}
      <CommunitySection />

      {/* Recently Added Properties */}
      <PropertiesSection
        title="Recently Added"
        description="New properties added daily from verified landlords"
        badgeText="Fresh Listings"
        units={recentUnits}
        loading={loading}
        router={router}
        emptyTitle="No Recent Listings"
        emptyDescription="New properties are added regularly"
        bgColor="from-gray-50 via-blue-50/30 to-white"
      />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Page_footer />
    </div>
  );
}
