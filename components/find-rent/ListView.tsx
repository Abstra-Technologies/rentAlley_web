import Image from "next/image";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaRuler,
  FaCouch,
  FaBed,
  FaBuilding,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified } from "react-icons/md";
import { Unit } from "./types";
import { formatCurrency, formatLocation } from "./utils";
import Pagination from "./Pagination";

interface ListViewProps {
  filteredUnits: Unit[];
  paginatedUnits: Unit[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onUnitClick: (unitId: string, propertyId: string) => void;
  onClearFilters: () => void;
}

export default function ListView({
  filteredUnits,
  paginatedUnits,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onUnitClick,
  onClearFilters,
}: ListViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FaSearch className="text-gray-300 text-5xl mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No units found
            </h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedUnits.map((unit) => (
              <article
                key={unit.unit_id}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => onUnitClick(unit.unit_id, unit.property_id)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image Section */}
                  <div className="relative sm:w-72 h-56 sm:h-auto flex-shrink-0">
                    {unit.photos?.[0] ? (
                      <Image
                        src={unit.photos[0]}
                        alt={`Unit ${unit.unit_name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 288px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
                        <BsImageAlt className="text-5xl text-gray-400" />
                      </div>
                    )}

                    {/* Unit Badge - PRIMARY */}
                    <div className="absolute top-3 left-3">
                      <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full shadow-lg backdrop-blur-sm">
                        <span className="font-bold text-sm">
                          Unit {unit.unit_name}
                        </span>
                      </div>
                    </div>

                    {/* FlexiPay Badge */}
                    {unit.flexipay_enabled === 1 && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                          <MdVerified />
                          <span>FlexiPay</span>
                        </div>
                      </div>
                    )}

                    {/* Price Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                      <div className="text-white">
                        <p className="font-bold text-2xl">
                          {formatCurrency(Number(unit.rent_amount))}
                        </p>
                        <p className="text-xs text-white/90">/month</p>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="mb-4">
                      {/* Property Name - Secondary */}
                      <div className="flex items-center gap-2 mb-2">
                        <FaBuilding className="text-gray-400 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-700 text-base">
                            {unit.property_name}
                          </h3>
                          <p className="text-xs text-gray-500 capitalize">
                            {unit.property_type.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0" />
                        <p className="text-sm">
                          {formatLocation(unit.city, unit.province)}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <FaRuler className="text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {unit.unit_size} sqm
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                          <FaCouch className="text-emerald-500" />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {unit.furnish.replace(/_/g, " ")}
                          </span>
                        </div>
                        {unit.bed_spacing === 1 && unit.avail_beds > 0 && (
                          <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                            <FaBed className="text-purple-500" />
                            <span className="text-sm font-semibold text-purple-700">
                              {unit.avail_beds}{" "}
                              {unit.avail_beds === 1 ? "bed" : "beds"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform transition-all group-hover:scale-[1.02] active:scale-[0.98]">
                      View Unit Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {filteredUnits.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
