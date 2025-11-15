"use client";

import { X } from "lucide-react";
import PropertyUnitMeterList from "./PropertyUnitMeterList";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  property_id: string;
}

export default function UnitMeterReadingsModal({
  isOpen,
  onClose,
  property_id,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          bg-white w-full md:max-w-4xl md:rounded-xl
          h-[90vh] md:h-[85vh] 
          overflow-hidden shadow-xl 
          animate-[slideUp_0.25s_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Unit Meter Readings
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="overflow-y-auto h-full px-3 md:px-6 py-4">
          <PropertyUnitMeterList property_id={property_id} />
        </div>
      </div>

      {/* Keyframe for slide animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
