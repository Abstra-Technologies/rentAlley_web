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

// Custom Marker Icon
const customIcon = L.icon({
    iconUrl: "/marker.png",
    iconSize: [30, 30],
    iconAnchor: [15, 45],
});

const defaultPosition = [14.5995, 120.9842]; // Manila

const reverseGeocode = async (lat: number, lng: number) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        return data.address;
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return null;
    }
};

// NEW: Recenter map on external coordinate updates
const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) map.setView(coords);
    }, [coords, map]);
    return null;
};

const SearchControl = ({ onSelect }) => {
    const map = useMap();
    const provider = new OpenStreetMapProvider();
    const searchControlRef = useRef<any>(null);

    useEffect(() => {
        if (!map) return;

        const searchControl = new GeoSearchControl({
            provider,
            showMarker: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
        });

        searchControlRef.current = searchControl;
        map.addControl(searchControl);

        map.on("geosearch/showlocation", async (result) => {
            const { location } = result;
            const address = await reverseGeocode(location.y, location.x);

            onSelect?.({
                lat: location.y,
                lng: location.x,
                address,
            });
        });

        return () => map.removeControl(searchControl);
    }, [map]);

    return null;
};

const DraggableMarker = ({ coords, onMove }) => {
    const [position, setPosition] = useState(coords || defaultPosition);

    useEffect(() => {
        setPosition(coords);
    }, [coords]);

    useMapEvents({
        click(e) {
            const newCoords = [e.latlng.lat, e.latlng.lng];
            setPosition(newCoords);
            onMove(newCoords);
        },
    });

    return (
        <Marker
            position={position}
            draggable
            eventHandlers={{
                dragend: async (e) => {
                    const latlng = e.target.getLatLng();
                    const newCoords = [latlng.lat, latlng.lng];
                    setPosition(newCoords);
                    onMove(newCoords);
                },
            }}
            icon={customIcon}
        />
    );
};

export default function PropertyMap({ setFields, coordinates }) {
    const [coords, setCoords] = useState(coordinates || defaultPosition);

    // Sync on external address selection
    useEffect(() => {
        if (coordinates) setCoords(coordinates);
    }, [coordinates]);

    const handleLocationChange = async (newCoords: number[]) => {
        const [lat, lng] = newCoords;
        setCoords(newCoords);

        const address = await reverseGeocode(lat, lng);
        if (!setFields) return;

        if (address) {
            setFields({
                latitude: lat,
                longitude: lng,
                street: address.road || address.pedestrian || "",
                brgyDistrict: address.suburb || address.neighbourhood || "",
                city: address.city || address.town || address.village || "",
                province:
                    address.state ||
                    address.region ||
                    address.province ||
                    address.county ||
                    "",
                zipCode: address.postcode || "",
            });
        }
    };

    return (
        <div className="h-[250px] w-full rounded-lg overflow-hidden border">
            <MapContainer
                center={coords}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution="© OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 🔥 FOLLOW THE ADDRESS → RECENTER MAP */}
                <RecenterMap coords={coords} />

                <SearchControl
                    onSelect={async ({ lat, lng, address }) => {
                        const newCoords = [lat, lng];
                        setCoords(newCoords);

                        if (address && setFields) {
                            setFields({
                                latitude: lat,
                                longitude: lng,
                                street: address.road || address.pedestrian || "",
                                brgyDistrict: address.suburb || address.neighbourhood || "",
                                city: address.city || address.town || address.village || "",
                                province:
                                    address.state ||
                                    address.region ||
                                    address.province ||
                                    address.county ||
                                    "",
                                zipCode: address.postcode || "",
                            });
                        }
                    }}
                />

                <DraggableMarker coords={coords} onMove={handleLocationChange} />
            </MapContainer>
        </div>
    );
}
