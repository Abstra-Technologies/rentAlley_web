"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Unit, FilterState } from "../../../types/types";
import LoadingScreen from "@/components/loadingScreen";
import MobileSearchHeader from "../../../components/find-rent/MobileSearchHeader";
import MobileFiltersPanel from "../../../components/find-rent/MobileFiltersPanel";
import ActiveFilters from "../../../components/find-rent/ActiveFilters";
import GridView from "../../../components/find-rent/GridView";
import ListView from "../../../components/find-rent/ListView";
import MapView from "../../../components/find-rent/MapView";
import { Suspense } from "react";

 function UnitSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Initialize filters from URL search params
  const initialSearchQuery = searchParams?.get("searchQuery") || "";

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialSearchQuery,
    propertyType: "",
    furnishing: "",
    minPrice: 0,
    maxPrice: 0,
    minSize: 0,
    bedSpacing: "",
  });

  // Update search query when URL params change
  useEffect(() => {
    if (initialSearchQuery) {
      setFilters((prev) => ({
        ...prev,
        searchQuery: initialSearchQuery,
      }));
    }
  }, [initialSearchQuery]);

  // Fetch units on component mount
  useEffect(() => {
    async function fetchUnits() {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    }

    fetchUnits();
  }, []);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const searchLower = filters.searchQuery.toLowerCase().trim();
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
        !filters.furnishing || unit.furnish === filters.furnishing;

      const unitPrice = Number(unit.rent_amount);
      const matchesMinPrice =
        filters.minPrice === 0 || unitPrice >= filters.minPrice;
      const matchesMaxPrice =
        filters.maxPrice === 0 || unitPrice <= filters.maxPrice;

      const matchesMinSize =
        filters.minSize === 0 || unit.unit_size >= filters.minSize;

      const matchesBedSpacing =
        !filters.bedSpacing ||
        unit.bed_spacing?.toString() === filters.bedSpacing;

      return (
        matchesSearch &&
        matchesType &&
        matchesFurnishing &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSize &&
        matchesBedSpacing
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleUnitClick = useCallback(
    (unitId: string, propertyId: string) => {
      router.push(`/pages/find-rent/${propertyId}/${unitId}`);
    },
    [router]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
      propertyType: "",
      furnishing: "",
      minPrice: 0,
      maxPrice: 0,
      minSize: 0,
      bedSpacing: "",
    });

    router.push("/pages/find-rent");
  }, [router]);

  const handleSearchChange = useCallback(
    (newQuery: string) => {
      setFilters((prev) => ({
        ...prev,
        searchQuery: newQuery,
      }));

      if (newQuery.trim()) {
        router.push(
          `/pages/find-rent?searchQuery=${encodeURIComponent(newQuery)}`
        );
      } else {
        router.push("/pages/find-rent");
      }
    },
    [router]
  );

  if (loading) {
    return <LoadingScreen message="Finding perfect units for you..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <MobileSearchHeader
        filters={filters}
        setFilters={(newFilters) => {
          setFilters(newFilters);

          if (newFilters.searchQuery !== filters.searchQuery) {
            if (newFilters.searchQuery.trim()) {
              router.push(
                `/pages/find-rent?searchQuery=${encodeURIComponent(
                  newFilters.searchQuery
                )}`
              );
            } else {
              router.push("/pages/find-rent");
            }
          }
        }}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredUnits={filteredUnits}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
        MobileFiltersPanel={MobileFiltersPanel}
        ActiveFilters={ActiveFilters}
      />

      <main className="flex-1 flex flex-col">
        {viewMode === "grid" && (
          <GridView
            filteredUnits={filteredUnits}
            paginatedUnits={paginationData.paginatedUnits}
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            totalItems={filteredUnits.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onUnitClick={handleUnitClick}
            onClearFilters={handleClearFilters}
          />
        )}
        {viewMode === "list" && (
          <ListView
            filteredUnits={filteredUnits}
            paginatedUnits={paginationData.paginatedUnits}
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            totalItems={filteredUnits.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onUnitClick={handleUnitClick}
            onClearFilters={handleClearFilters}
          />
        )}
        {viewMode === "map" && (
          <div className="flex-1">
            <MapView
              key="map-view-key"
              filteredUnits={mapUnits}
              onUnitClick={handleUnitClick}
            />
          </div>
        )}
      </main>
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