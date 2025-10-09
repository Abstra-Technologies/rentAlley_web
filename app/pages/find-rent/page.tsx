"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Unit, FilterState } from "../../../types/types";

import LoadingScreen from "@/components/loadingScreen";
import MobileSearchHeader from "../../../components/find-rent/MobileSearchHeader";
import MobileFiltersPanel from "../../../components/find-rent/MobileFiltersPanel";
import ActiveFilters from "../../../components/find-rent/ActiveFilters";
import GridView from "../../../components/find-rent/GridView";
import ListView from "../../../components/find-rent/ListView";
import MapView from "../../../components/find-rent/MapView";

export default function UnitSearchPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    propertyType: "",
    furnishing: "",
    minPrice: 0,
    maxPrice: 0,
    minSize: 0,
    bedSpacing: "",
  });

  useEffect(() => {
    async function fetchUnits() {
      try {
        setLoading(true);
        const res = await fetch("/api/properties/findRent/units");
        if (!res.ok) throw new Error("Failed to fetch units");

        const data = await res.json();
        console.log("data received", data);

        console.log("Data array for setUnits:", data.data);

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
      const matchesSearch =
        !filters.searchQuery ||
        unit.property_name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        unit.city.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        unit.province.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesType =
        !filters.propertyType ||
        unit.property_type.toLowerCase() === filters.propertyType.toLowerCase();

      const matchesFurnishing =
        !filters.furnishing || unit.furnish === filters.furnishing;

      const matchesMinPrice =
        filters.minPrice === 0 || Number(unit.rent_amount) >= filters.minPrice;

      const matchesMaxPrice =
        filters.maxPrice === 0 || Number(unit.rent_amount) <= filters.maxPrice;

      const matchesMinSize =
        filters.minSize === 0 || unit.unit_size >= filters.minSize;

      return (
        matchesSearch &&
        matchesType &&
        matchesFurnishing &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinSize
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
  }, []);

  if (loading) {
    return <LoadingScreen message="Finding perfect units for you..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Search Header */}
      <MobileSearchHeader
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredUnits={filteredUnits}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
        MobileFiltersPanel={MobileFiltersPanel}
        ActiveFilters={ActiveFilters}
      />

      <main className="flex-1 flex flex-col">
        {" "}
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
            {" "}
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
