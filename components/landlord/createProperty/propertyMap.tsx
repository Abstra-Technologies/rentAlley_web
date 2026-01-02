"use client";

import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

/* -----------------------------------------
   ICON
----------------------------------------- */
const customIcon = L.icon({
    iconUrl: "/marker.png",
    iconSize: [30, 30],
    iconAnchor: [15, 45],
});

const DEFAULT_POS: [number, number] = [14.5995, 120.9842];

/* -----------------------------------------
   REVERSE GEOCODE (API)
----------------------------------------- */
async function reverseGeocode(lat: number, lng: number) {
    try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.address || null;
    } catch {
        return null;
    }
}

/* -----------------------------------------
   MAP RESIZE FIX
----------------------------------------- */
function FixMapResize() {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 0);
    }, [map]);

    return null;
}

/* -----------------------------------------
   RECENTER MAP
----------------------------------------- */
function RecenterMap({ coords }: { coords: [number, number] }) {
    const map = useMap();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            return;
        }
        map.flyTo(coords, map.getZoom(), { animate: true });
    }, [coords, map]);

    return null;
}

/* -----------------------------------------
   SEARCH CONTROL
----------------------------------------- */
function SearchControl({
                           onSelect,
                       }: {
    onSelect: (data: { lat: number; lng: number; address?: any }) => void;
}) {
    const map = useMap();
    const controlRef = useRef<any>(null);

    useEffect(() => {
        if (!map || controlRef.current) return;

        const provider = new OpenStreetMapProvider();
        const control = new GeoSearchControl({
            provider,
            showMarker: false,
            autoClose: true,
            animateZoom: true,
        });

        controlRef.current = control;
        map.addControl(control);

        map.on("geosearch/showlocation", async (e: any) => {
            const lat = e.location.y;
            const lng = e.location.x;
            const address = await reverseGeocode(lat, lng);

            onSelect({ lat, lng, address });
        });

        return () => {
            if (controlRef.current) {
                map.removeControl(controlRef.current);
                controlRef.current = null;
            }
        };
    }, [map, onSelect]);

    return null;
}

/* -----------------------------------------
   DRAGGABLE MARKER
----------------------------------------- */
function DraggableMarker({
                             coords,
                             onMove,
                         }: {
    coords: [number, number];
    onMove: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker | null>(null);

    useMapEvents({
        click(e) {
            onMove(e.latlng.lat, e.latlng.lng);
        },
    });

    return (
        <Marker
            position={coords}
            draggable
            icon={customIcon}
            ref={(ref) => {
                if (ref) markerRef.current = ref;
            }}
            eventHandlers={{
                dragend: () => {
                    if (!markerRef.current) return;
                    const { lat, lng } = markerRef.current.getLatLng();
                    onMove(lat, lng);
                },
            }}
        />
    );
}

/* -----------------------------------------
   MAIN MAP
----------------------------------------- */
export default function PropertyMap({
                                        setFields,
                                        coordinates,
                                    }: {
    setFields: (data: any) => void;
    coordinates: [number, number];
}) {
    const [coords, setCoords] = useState<[number, number]>(
        coordinates || DEFAULT_POS
    );

    useEffect(() => {
        if (coordinates) setCoords(coordinates);
    }, [coordinates]);

    async function handleMove(lat: number, lng: number, address?: any) {
        setCoords([lat, lng]);

        const resolvedAddress = address ?? (await reverseGeocode(lat, lng));
        if (!resolvedAddress) return;

        setFields({
            latitude: lat,
            longitude: lng,
            street: resolvedAddress.road || resolvedAddress.pedestrian || "",
            brgyDistrict:
                resolvedAddress.suburb || resolvedAddress.neighbourhood || "",
            city:
                resolvedAddress.city ||
                resolvedAddress.town ||
                resolvedAddress.village ||
                "",
            province:
                resolvedAddress.state ||
                resolvedAddress.region ||
                resolvedAddress.province ||
                resolvedAddress.county ||
                "",
            zipCode: resolvedAddress.postcode || "",
        });
    }

    return (
        <div className="w-full h-[220px] sm:h-[260px] lg:h-full min-h-[220px]">
            <MapContainer
                center={coords}
                zoom={15}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution="© OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    subdomains={["a", "b", "c"]}
                />

                <FixMapResize />
                <RecenterMap coords={coords} />

                <SearchControl
                    onSelect={({ lat, lng, address }) =>
                        handleMove(lat, lng, address)
                    }
                />

                <DraggableMarker
                    coords={coords}
                    onMove={(lat, lng) => handleMove(lat, lng)}
                />
            </MapContainer>
        </div>
    );
}
