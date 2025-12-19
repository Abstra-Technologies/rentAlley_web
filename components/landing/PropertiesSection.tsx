// File: /components/landing/PropertiesSection.tsx

"use client";

import Link from "next/link";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import UnitCard from "@/components/find-rent/UnitCard";
import { Unit } from "@/types/landing";
import { SectionBadge, LoadingSpinner, EmptyState } from "./UIComponents";

interface PropertiesSectionProps {
  title: string;
  description: string;
  badgeText: string;
  units: Unit[];
  loading: boolean;
  router: any;
  emptyTitle: string;
  emptyDescription: string;
  bgColor?: string;
}

export default function PropertiesSection({
  title,
  description,
  badgeText,
  units,
  loading,
  router,
  emptyTitle,
  emptyDescription,
  bgColor = "white",
}: PropertiesSectionProps) {
  const isFeatured = badgeText === "Featured Listings";
  const BadgeIcon = isFeatured ? Star : Sparkles;
  const spinnerColor = isFeatured ? "blue" : "emerald";
  const buttonGradient = isFeatured
    ? "from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
    : "from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700";
  const buttonText = isFeatured
    ? "View All Properties"
    : "Explore All Listings";

  return (
    <section className={`py-12 sm:py-16 bg-gradient-to-br ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="text-center mb-12">
              <SectionBadge icon={BadgeIcon} text={badgeText} />

              <h2
                  className="
      text-2xl
      sm:text-3xl
      lg:text-4xl
      font-bold
      text-gray-900
      mb-4
      leading-tight
    "
              >
                  {title}
              </h2>

              <p
                  className="
      text-base
      sm:text-lg
      text-gray-600
      max-w-xl
      mx-auto
      leading-relaxed
    "
              >
                  {description}
              </p>
          </div>


          {/* Content */}
        {loading ? (
          <LoadingSpinner color={spinnerColor} />
        ) : units.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <>
            {/* Units Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
              {units.map((unit, index) => (
                <div
                  key={unit.unit_id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <UnitCard
                    unit={unit}
                    onClick={() =>
                      router.push(
                        `/pages/find-rent/${unit.property_id}/${unit.unit_id}`
                      )
                    }
                  />
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Link
                href="/pages/find-rent"
                className={`group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r ${buttonGradient} text-white font-semibold text-lg rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95`}
              >
                {buttonText}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
