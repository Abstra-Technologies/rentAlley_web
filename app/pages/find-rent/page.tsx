"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Unit, FilterState } from "@/types/types";
import LoadingScreen from "@/components/loadingScreen";
import MobileSearchHeader from "@/components/find-rent/MobileSearchHeader";
import MobileFiltersPanel from "@/components/find-rent/MobileFiltersPanel";
import DesktopFiltersPanel from "@/components/find-rent/DesktopFiltersPanel";
import ActiveFilters from "@/components/find-rent/ActiveFilters";
import GridView from "@/components/find-rent/GridView";
import MapView from "@/components/find-rent/MapView";
import { Suspense } from "react";

function getFiltersFromUrl(
  params: Readonly<URLSearchParams> | null
): FilterState {
  return {
    searchQuery: params?.get("searchQuery") || "",
    propertyType: params?.get("propertyType") || "",
    furnishing: params?.get("furnishing") || "",
    minPrice: Number(params?.get("minPrice")) || 0,
    maxPrice: Number(params?.get("maxPrice")) || 0,
    minSize: Number(params?.get("minSize")) || 0,
    location: params?.get("location") || "",
    unitStyle: params?.get("unitStyle") || "",
  };
}

function UnitSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [units, setUnits] = useState<Unit[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [itemsPerPage] = useState(12);

  const filters: FilterState = useMemo(
    () => getFiltersFromUrl(searchParams),
    [searchParams]
  );

  const currentPage: number = useMemo(
    () => Number(searchParams?.get("page")) || 1,
    [searchParams]
  );

  // ============================================================
  // ⭐ SEO: Dynamic Metadata (Title, Description, Canonical, OG)
  // ============================================================
  const canonicalUrl = `https://rent-alley-web.vercel.app/pages/find-rent?${searchParams.toString()}`;

  const pageTitle = filters.searchQuery
    ? `Find Rent in ${filters.searchQuery} | Affordable Units for Rent`
    : "Find Rent | Browse Apartments, Rooms, Warehouse, Office Space for Rent";

  const pageDescription =
    "Search rental units including apartments, condos, dorms, and rooms for rent in the Philippines. Filter by price, location, unit style, and more.";

  const createParams = useCallback(
    (newFilters: FilterState, newPage: number) => {
      const params = new URLSearchParams();

      const searchQuery = (newFilters.searchQuery || "").trim();
      if (searchQuery) params.set("searchQuery", searchQuery);

      if (newFilters.propertyType)
        params.set("propertyType", newFilters.propertyType);
      if (newFilters.furnishing)
        params.set("furnishing", newFilters.furnishing);
      if (newFilters.minPrice && newFilters.minPrice > 0)
        params.set("minPrice", newFilters.minPrice.toString());
      if (newFilters.maxPrice && newFilters.maxPrice > 0)
        params.set("maxPrice", newFilters.maxPrice.toString());
      if (newFilters.minSize && newFilters.minSize > 0)
        params.set("minSize", newFilters.minSize.toString());
      if (newFilters.location) params.set("location", newFilters.location);
      if (newFilters.unitStyle) params.set("unitStyle", newFilters.unitStyle);

      if (newPage > 1) params.set("page", newPage.toString());

      return params;
    },
    []
  );

  const handleUnitClick = useCallback(
    (unitId: string, propertyId: string) => {
      router.push(`/pages/find-rent/${propertyId}/${unitId}`);
    },
    [router]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const newParams = createParams(filters, newPage);
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [router, pathname, filters, createParams]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      const newParams = createParams(newFilters, 1);
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [router, pathname, createParams]
  );

  const handleClearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  useEffect(() => {
    async function fetchUnits() {
      try {
        const res = await fetch("/api/properties/findRent/units");
        if (!res.ok) throw new Error("Failed to fetch units");

        const data = await res.json();

        if (data?.data && Array.isArray(data.data)) {
          setUnits(data.data);
        } else {
          setUnits([]);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
        setUnits([]);
      } finally {
        setIsInitialLoad(false);
      }
    }

    fetchUnits();
  }, []);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const searchLower = (filters.searchQuery || "").toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        unit.property_name.toLowerCase().includes(searchLower) ||
        unit.city.toLowerCase().includes(searchLower) ||
        unit.province.toLowerCase().replace(/_/g, " ").includes(searchLower) ||
        unit.street?.toLowerCase().includes(searchLower);

      const matchesType =
        !filters.propertyType ||
        unit.property_type.toLowerCase() === filters.propertyType.toLowerCase();

      const matchesFurnishing =
        !filters.furnishing ||
        unit.furnish.toLowerCase() === filters.furnishing.toLowerCase();

      const unitPrice = Number(unit.rent_amount);
      const matchesMinPrice =
        !filters.minPrice ||
        filters.minPrice === 0 ||
        unitPrice >= filters.minPrice;
      const matchesMaxPrice =
        !filters.maxPrice ||
        filters.maxPrice === 0 ||
        unitPrice <= filters.maxPrice;

      const matchesMinSize =
        !filters.minSize ||
        filters.minSize === 0 ||
        unit.unit_size >= filters.minSize;

      const matchesLocation =
        !filters.location ||
        unit.province.toLowerCase() === filters.location.toLowerCase();

      const matchesUnitStyle =
        !filters.unitStyle ||
        unit.unit_style.toLowerCase() === filters.unitStyle.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesFurnishing &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSize &&
        matchesLocation &&
        matchesUnitStyle
      );
    });
  }, [units, filters]);

  const mapUnits = useMemo(() => {
    return filteredUnits.filter((unit) => unit.latitude && unit.longitude);
  }, [filteredUnits]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUnits = filteredUnits.slice(startIndex, endIndex);
    return { totalPages, paginatedUnits };
  }, [filteredUnits, currentPage, itemsPerPage]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === "searchQuery") return false;
      if (typeof value === "number") return value > 0;
      return value !== "";
    }).length;
  }, [filters]);

  if (isInitialLoad) {
    return <LoadingScreen message="Finding perfect units for you..." />;
  }

  // ============================================================
  // ⭐ SEO: JSON-LD Schema for Search Results + Units
  // ============================================================
  const jsonLdListings = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: "Find Rent - Upkyp",
    description: pageDescription,
    itemListElement: filteredUnits.map((unit, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://rent-alley-web.vercel.app/pages/find-rent/${unit.property_id}/${unit.unit_id}`,
      item: {
        "@type": "Apartment",
        name: `${unit.unit_style} for rent in ${unit.city}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: unit.city,
          addressRegion: unit.province,
        },
        geo: unit.latitude
          ? {
              "@type": "GeoCoordinates",
              latitude: unit.latitude,
              longitude: unit.longitude,
            }
          : undefined,
        offers: {
          "@type": "Offer",
          price: unit.rent_amount,
          priceCurrency: "PHP",
          availability: unit.status === "unoccupied" ? "InStock" : "OutOfStock",
        },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/80">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Search Header */}
      <MobileSearchHeader
        filters={filters}
        setFilters={handleFiltersChange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredUnits={filteredUnits}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
        activeFilterCount={activeFilterCount}
        MobileFiltersPanel={MobileFiltersPanel}
        ActiveFilters={ActiveFilters}
      />

      {/* Main Content */}
      <main className="flex-1 relative">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          {viewMode === "grid" && (
            <GridView
              filteredUnits={filteredUnits}
              paginatedUnits={paginationData.paginatedUnits}
              currentPage={currentPage}
              totalPages={paginationData.totalPages}
              totalItems={filteredUnits.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onUnitClick={handleUnitClick}
              onClearFilters={handleClearFilters}
              filters={filters}
              setFilters={handleFiltersChange}
              DesktopFiltersPanel={DesktopFiltersPanel}
            />
          )}

          {viewMode === "map" && (
            <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] -mx-4 sm:-mx-6 lg:-mx-8 md:mx-0 md:rounded-2xl md:overflow-hidden md:shadow-xl md:border md:border-gray-200/60">
              <MapView
                key="map-view-key"
                filteredUnits={mapUnits}
                onUnitClick={handleUnitClick}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom padding for fixed elements */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

export default function UnitSearchPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading search results..." />}>
      <UnitSearchContent />
    </Suspense>
  );
}
