"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

interface MapDisplayProps {
  latitude: number;
  longitude: number;
}

export default function MapDisplay({ latitude, longitude }: MapDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && mounted) {
      import("leaflet").then((L) => {
        const leaflet = L.default || L;
        
        const icon = leaflet.divIcon({
          html: `
            <div style="position: relative;">
              <svg width="40" height="52" viewBox="0 0 40 52">
                <defs>
                  <linearGradient id="markerGrad-${latitude}-${longitude}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3B82F6"/>
                    <stop offset="100%" style="stop-color:#10B981"/>
                  </linearGradient>
                  <filter id="shadow-${latitude}-${longitude}">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
                  </filter>
                </defs>
                <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 32 20 32s20-17 20-32c0-11.046-8.954-20-20-20z" 
                      fill="url(#markerGrad-${latitude}-${longitude})" filter="url(#shadow-${latitude}-${longitude})"/>
                <circle cx="20" cy="20" r="8" fill="white"/>
                <circle cx="20" cy="20" r="5" fill="url(#markerGrad-${latitude}-${longitude})"/>
              </svg>
            </div>
          `,
          className: "custom-location-marker",
          iconSize: [40, 52],
          iconAnchor: [20, 52],
          popupAnchor: [0, -52],
        });
        setCustomIcon(icon);
      });
    }
  }, [mounted, latitude, longitude]);

  if (!mounted || !customIcon) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={customIcon} />
    </MapContainer>
  );
}