import Image from "next/image";
import {
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

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-emerald-200 transform hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-emerald-50">
        {unit.photos?.[0] ? (
          <Image
            src={unit.photos[0]}
            alt={`Unit ${unit.unit_name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BsImageAlt className="text-4xl text-gray-400" />
          </div>
        )}

        {/* Unit Badge - Primary Focus */}
        <div className="absolute top-3 left-3">
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full shadow-lg backdrop-blur-sm">
            <span className="font-bold text-sm">Unit {unit.unit_name}</span>
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white">
            <p className="font-bold text-2xl">
              {formatCurrency(Number(unit.rent_amount))}
            </p>
            <p className="text-xs text-white/90">/month</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Property Name - Secondary */}
        <div className="flex items-start gap-2 mb-3">
          <FaBuilding className="text-gray-400 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-700 text-sm truncate">
              {unit.property_name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">{unit.property_type.replace(/_/g, " ")}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-3 text-gray-600">
          <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0" />
          <p className="text-xs truncate">
            {formatLocation(unit.city, unit.province)}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2">
            <FaRuler className="text-blue-500 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-700">
              {unit.unit_size} sqm
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2">
            <FaCouch className="text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-700 capitalize truncate">
              {unit.furnish.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Bed Spacing */}
        {unit.bed_spacing === 1 && unit.avail_beds > 0 && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded-lg">
            <FaBed className="text-purple-500" />
            <span className="text-xs font-semibold text-purple-700">
              {unit.avail_beds} {unit.avail_beds === 1 ? "bed" : "beds"}{" "}
              available
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform transition-all group-hover:scale-[1.02] active:scale-[0.98]">
          View Unit Details
        </button>
      </div>
    </article>
  );
}
