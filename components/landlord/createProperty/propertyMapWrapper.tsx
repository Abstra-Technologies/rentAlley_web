"use client";

import { useEffect, useRef } from "react";

export default function PropertyMap({ coordinates, setFields }) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let L: any;

        const initMap = async () => {
            if (!containerRef.current || mapRef.current) return;

            // ✅ Lazy import Leaflet (HMR-safe)
            const leaflet = await import("leaflet");
            L = leaflet.default;

            // ❗ Fix missing marker icons (Leaflet + Next issue)
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            mapRef.current = L.map(containerRef.current).setView(
                coordinates || [14.5995, 120.9842],
                15
            );

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }).addTo(mapRef.current);
        };

        initMap();

        return () => {
            // ✅ Proper cleanup (prevents reuse error)
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full rounded-xl"
        />
    );
}
