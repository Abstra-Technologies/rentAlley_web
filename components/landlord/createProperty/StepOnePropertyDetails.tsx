"use client";

import React, { useEffect, useState } from "react";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import AmenitiesSelector from "./amenities-selector";
import { FaImage } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./propertyMap"), { ssr: false });

export default function StepOneCreateProperty() {
    const { property, setProperty, photos, setPhotos } = usePropertyStore();

    const [coords, setCoords] = useState({
        lat: property?.latitude ?? 14.5995,
        lng: property?.longitude ?? 120.9842,
    });

    const [addressQuery, setAddressQuery] = useState(property?.street || "");
    const [addressResults, setAddressResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const resolveProvince = (address: any) =>
        address?.state ||
        address?.region ||
        address?.province ||
        address?.county ||
        "";

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (addressQuery.length < 4) {
                setAddressResults([]);
                return;
            }

            try {
                const res = await fetch(
                    `/api/geocode?q=${encodeURIComponent(addressQuery)}`
                );

                if (!res.ok) {
                    setAddressResults([]);
                    return;
                }

                const data = await res.json();
                setAddressResults(data);
            } catch (err) {
                console.error("Search failed:", err);
                setAddressResults([]);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [addressQuery]);

    /* -----------------------------------------
       SELECT ADDRESS
    ----------------------------------------- */
    const handleAddressSelect = (place: any) => {
        const { lat, lon, display_name, address } = place;

        const parsed = {
            street: address?.road || address?.pedestrian || display_name || "",
            brgyDistrict: address?.suburb || address?.neighbourhood || "",
            city: address?.city || address?.town || address?.village || "",
            province: resolveProvince(address),
            zipCode: address?.postcode || "",
            latitude: Number(lat),
            longitude: Number(lon),
        };

        setProperty({ ...property, ...parsed });
        setAddressQuery(parsed.street);
        setCoords({ lat: parsed.latitude, lng: parsed.longitude });
        setAddressResults([]);
    };

    /* -----------------------------------------
       GENERIC HANDLER
    ----------------------------------------- */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProperty({ ...property, [e.target.name]: e.target.value });
    };

    /* -----------------------------------------
       PHOTO UPLOAD
    ----------------------------------------- */
    const onDrop = (acceptedFiles: File[]) => {
        const newPhotos = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setPhotos([...photos, ...newPhotos]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        multiple: true,
        onDrop,
    });

    const removeImage = (i: number) => {
        setPhotos(photos.filter((_, idx) => idx !== i));
    };

    /* -----------------------------------------
       AI DESCRIPTION
    ----------------------------------------- */
    const handleGenerateDescription = async () => {
        setLoading(true);

        const p = property;
        const prompt = `
Create a compelling property description based on:
Name: ${p.propertyName}
Type: ${p.propertyType}
Amenities: ${p.amenities?.join(", ") || "None"}
Address: ${p.street}, ${p.brgyDistrict}, ${p.city}, ${p.zipCode}, ${p.province}
`;

        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-r1:free",
                    messages: [
                        { role: "system", content: "You are a real estate assistant." },
                        { role: "user", content: prompt },
                    ],
                }),
            });

            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content?.trim();
            if (text) setProperty({ ...property, propDesc: text });
        } catch {
            alert("Failed to generate description");
        }

        setLoading(false);
    };

    /* -----------------------------------------
       MAP CALLBACK
    ----------------------------------------- */
    const mapSetFields = (data: any) => {
        if (!data) return;

        const parsed = {
            street: data.street || "",
            brgyDistrict: data.brgyDistrict || "",
            city: data.city || "",
            province: data.province || "",
            zipCode: data.zipCode || "",
            latitude: data.latitude,
            longitude: data.longitude,
        };

        setProperty({ ...property, ...parsed });
        if (parsed.street) setAddressQuery(parsed.street);
        setCoords({ lat: parsed.latitude, lng: parsed.longitude });
    };

    /* -----------------------------------------
       TOGGLE PREFERENCES
    ----------------------------------------- */
    const togglePreference = (key: string) => {
        const prefs = property.propertyPreferences || [];
        setProperty({
            ...property,
            propertyPreferences: prefs.includes(key)
                ? prefs.filter((v) => v !== key)
                : [...prefs, key],
        });
    };

    /* -----------------------------------------
       RENDER
    ----------------------------------------- */
    return (
        <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6 space-y-6">
            {/* TITLE */}
            <div>
                <h1 className="text-xl font-semibold">Property Details</h1>
                <p className="text-sm text-gray-500">
                    Fill in the required information below.
                </p>
            </div>

            <div className="space-y-6">
                {/* PROPERTY TYPE */}
                <section className="space-y-2">
                    <h2 className="text-sm font-medium">1. Property Type</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PROPERTY_TYPES.map((type) => {
                            const active = property.propertyType === type.value;
                            return (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() =>
                                        setProperty({ ...property, propertyType: type.value })
                                    }
                                    className={`rounded-lg border p-2 text-xs flex flex-col items-center gap-1 ${
                                        active
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="text-base">{type.icon}</span>
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* PROPERTY NAME */}
                <section className="space-y-1">
                    <h2 className="text-sm font-medium">2. Property Name</h2>
                    <input
                        name="propertyName"
                        value={property.propertyName || ""}
                        onChange={handleChange}
                        placeholder="Sunshine Residences"
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                    />
                </section>

                {/* LOCATION */}
                <section className="space-y-2">
                    <h2 className="text-sm font-medium">3. Location</h2>

                    <div className="grid lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-2 space-y-3">
                            <div className="relative">
                                <input
                                    value={addressQuery}
                                    onChange={(e) => {
                                        setAddressQuery(e.target.value);
                                        setProperty({ ...property, street: e.target.value });
                                    }}
                                    placeholder="Street address"
                                    className="w-full px-3 py-2 text-sm border rounded-lg"
                                />

                                {addressResults.length > 0 && (
                                    <ul className="absolute z-20 bg-white border rounded-lg w-full max-h-48 overflow-auto">
                                        {addressResults.map((res, i) => (
                                            <li
                                                key={i}
                                                onClick={() => handleAddressSelect(res)}
                                                className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer"
                                            >
                                                {res.display_name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2">
                                <input
                                    name="brgyDistrict"
                                    value={property.brgyDistrict || ""}
                                    onChange={handleChange}
                                    placeholder="Barangay"
                                    className="px-3 py-2 text-sm border rounded-lg"
                                />
                                <input
                                    name="city"
                                    value={property.city || ""}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="px-3 py-2 text-sm border rounded-lg"
                                />
                                <input
                                    name="zipCode"
                                    value={property.zipCode || ""}
                                    onChange={handleChange}
                                    placeholder="Zip Code"
                                    className="px-3 py-2 text-sm border rounded-lg"
                                />
                                <input
                                    name="province"
                                    value={property.province || ""}
                                    readOnly
                                    className="px-3 py-2 text-sm border rounded-lg bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="relative w-full h-[260px] min-h-[260px] rounded-lg overflow-hidden border z-0">
                            <PropertyMap
                                setFields={mapSetFields}
                                coordinates={[coords.lat, coords.lng]}
                            />
                        </div>
                    </div>
                </section>

                {/* AMENITIES */}
                <section className="space-y-2">
                    <h2 className="text-sm font-medium">4. Amenities</h2>
                    <AmenitiesSelector
                        selectedAmenities={property.amenities || []}
                        onAmenityChange={(a) => {
                            const arr = property.amenities || [];
                            setProperty({
                                ...property,
                                amenities: arr.includes(a)
                                    ? arr.filter((x) => x !== a)
                                    : [...arr, a],
                            });
                        }}
                    />
                </section>

                {/* DESCRIPTION */}
                <section className="space-y-1">
                    <h2 className="text-sm font-medium">5. Description</h2>
                    <textarea
                        name="propDesc"
                        value={property.propDesc || ""}
                        onChange={handleChange}
                        className="w-full h-24 text-sm border rounded-lg px-3 py-2"
                    />
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={loading}
                        className="text-xs text-blue-600 underline"
                    >
                        {loading ? "Generating..." : "Generate with AI"}
                    </button>
                </section>

                {/* PHOTOS */}
                <section className="space-y-2">
                    <h2 className="text-sm font-medium">6. Photos</h2>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center text-xs ${
                            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                        }`}
                    >
                        <input {...getInputProps()} />
                        <FaImage className="mx-auto text-gray-400 text-xl" />
                        <p className="mt-1">
                            {isDragActive ? "Drop images here" : "Click or drag images"}
                        </p>
                    </div>

                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {photos.map((p, i) => (
                                <div key={i} className="relative">
                                    <img
                                        src={p.preview}
                                        className="h-24 w-full object-cover rounded-md"
                                    />
                                    <button
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
