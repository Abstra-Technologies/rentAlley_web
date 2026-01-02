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
   API REVERSE GEOCODE
----------------------------------------- */
const reverseGeocode = async (lat: number, lng: number) => {
    try {
        const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.address || null;
    } catch {
        return null;
    }
};

/* -----------------------------------------
   RECENTER (SAFE)
----------------------------------------- */
const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    const ready = useRef(false);

    useEffect(() => {
        if (!map) return;

        if (!ready.current) {
            ready.current = true;
            return;
        }

        map.flyTo(coords, map.getZoom(), { animate: true });
    }, [coords, map]);

    return null;
};

/* -----------------------------------------
   SEARCH CONTROL
----------------------------------------- */
const SearchControl = ({ onSelect }: any) => {
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

        map.on("geosearch/showlocation", async (result: any) => {
            const { location } = result;
            const address = await reverseGeocode(location.y, location.x);
            onSelect?.({
                lat: location.y,
                lng: location.x,
                address,
            });
        });

        return () => {
            if (controlRef.current) {
                map.removeControl(controlRef.current);
                controlRef.current = null;
            }
        };
    }, [map, onSelect]);

    return null;
};

/* -----------------------------------------
   DRAGGABLE MARKER (GUARDED)
----------------------------------------- */
const DraggableMarker = ({
                             coords,
                             onMove,
                         }: {
    coords: [number, number];
    onMove: (c: [number, number]) => void;
}) => {
    const markerRef = useRef<L.Marker | null>(null);

    useMapEvents({
        click(e) {
            onMove([e.latlng.lat, e.latlng.lng]);
        },
    });

    return (
        <Marker
            position={coords}
            icon={customIcon}
            draggable
            ref={(ref) => {
                if (ref) markerRef.current = ref;
            }}
            eventHandlers={{
                dragend: () => {
                    if (!markerRef.current) return;
                    const latlng = markerRef.current.getLatLng();
                    onMove([latlng.lat, latlng.lng]);
                },
            }}
        />
    );
};

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

    const handleMove = async ([lat, lng]: [number, number]) => {
        setCoords([lat, lng]);

        const address = await reverseGeocode(lat, lng);
        if (!address) return;

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
    };

    return (
        <div className="h-full w-full">
            <MapContainer
                center={coords}
                zoom={15}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution="© OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap coords={coords} />
                <SearchControl onSelect={handleMove} />
                <DraggableMarker coords={coords} onMove={handleMove} />
            </MapContainer>
        </div>
    );
}
