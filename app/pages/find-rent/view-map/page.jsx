'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/marker.png',
    shadowUrl: '/leaflet/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/4872/4872521.png", // sample pin
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'animate-pulse',
});


// Center map to user's location
function FlyToUserLocation({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView([coords.lat, coords.lng], 13);
        }
    }, [coords]);
    return null;
}

export default function PropertyMapPage() {
    const [userCoords, setUserCoords] = useState(null);
    const [properties, setProperties] = useState([]);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            });
        }
    }, []);

    // Load properties (adjust your API endpoint)
    useEffect(() => {
        axios.get('/api/properties/findRent')
            .then((res) => setProperties(res.data))
            .catch((err) => console.error('Failed to fetch properties', err));
    }, []);

    const defaultCenter = userCoords || { lat: 14.5995, lng: 120.9842 }; // Default to Manila

    return (
        <div className="w-full h-screen">
            <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userCoords && (
                    <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {properties
                    .filter(
                        (property) =>
                            !isNaN(parseFloat(property.latitude)) &&
                            !isNaN(parseFloat(property.longitude))
                    )
                    .map((property) => (
                        <Marker
                            key={property.property_id}
                            position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
                        >
                            <Popup>
                                <strong>{property.property_name || 'Property'}</strong>
                                <br />
                                {property.street}, {property.city}, {property.province}
                            </Popup>
                        </Marker>
                    ))}


                <FlyToUserLocation coords={userCoords} />
            </MapContainer>
        </div>
    );
}
