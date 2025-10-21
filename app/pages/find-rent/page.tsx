"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Unit, FilterState } from "../../../types/types";
import LoadingScreen from "@/components/loadingScreen";
import MobileSearchHeader from "../../../components/find-rent/MobileSearchHeader";
import MobileFiltersPanel from "../../../components/find-rent/MobileFiltersPanel";
import ActiveFilters from "../../../components/find-rent/ActiveFilters";
import GridView from "../../../components/find-rent/GridView";
import ListView from "../../../components/find-rent/ListView";
import MapView from "../../../components/find-rent/MapView";
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
    bedSpacing: params?.get("bedSpacing") || "",
  };
}

function UnitSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
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

  const createParams = useCallback(
    (newFilters: FilterState, newPage: number) => {
      const params = new URLSearchParams();

      if (newFilters.searchQuery.trim()) {
        params.set("searchQuery", newFilters.searchQuery.trim());
      }
      if (newFilters.propertyType) {
        params.set("propertyType", newFilters.propertyType);
      }
      if (newFilters.furnishing) {
        params.set("furnishing", newFilters.furnishing);
      }
      if (newFilters.minPrice > 0) {
        params.set("minPrice", newFilters.minPrice.toString());
      }
      if (newFilters.maxPrice > 0) {
        params.set("maxPrice", newFilters.maxPrice.toString());
      }
      if (newFilters.minSize > 0) {
        params.set("minSize", newFilters.minSize.toString());
      }
      if (newFilters.bedSpacing) {
        params.set("bedSpacing", newFilters.bedSpacing);
      }

      if (newPage > 1) {
        params.set("page", newPage.toString());
      }

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

  const handleSearchChange = useCallback(
    (newQuery: string) => {
      const newFilters = { ...filters, searchQuery: newQuery };
      const newParams = createParams(newFilters, 1);
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

  if (loading) {
    return <LoadingScreen message="Finding perfect units for you..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <MobileSearchHeader
        filters={filters}
        setFilters={handleFiltersChange}
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
            onPageChange={handlePageChange}
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
            onPageChange={handlePageChange}
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
