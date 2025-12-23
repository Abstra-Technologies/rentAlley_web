"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Page_footer from "@/components/navigation/page_footer";
import LoadingScreen from "@/components/loadingScreen";
import AnimatedFeatures from "@/components/ui/Process";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import StatsSection from "@/components/landing/StatsSection";
import CTASection from "@/components/landing/CTASection";
import "@/app/styles/landing-animations.css";

export default function SplashScreen() {
  const router = useRouter();
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

  if (checkingAuth) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <HeroSection />

      {/* Pain Points */}
      <PainPointsSection />

      {/* How It Works (Existing AnimatedFeatures) */}
      <AnimatedFeatures />

      {/* Features Showcase */}
      <FeaturesShowcase />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Stats */}
      <StatsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Page_footer />
    </div>
  );
}
