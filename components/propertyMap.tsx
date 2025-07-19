"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";

const defaultPosition = [14.5995, 120.9842]; // Manila

const DraggableMarker = ({ setCoords }) => {
  const [position, setPosition] = useState(defaultPosition);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
          setCoords({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
      icon={L.icon({
        iconUrl: "/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })}
    />
  );
};

export default function PropertyMap({ setCoords }) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker setCoords={setCoords} />
      </MapContainer>
    </div>
  );
}
