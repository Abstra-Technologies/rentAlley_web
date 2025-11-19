"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import { PROPERTY_TYPES } from "@/constant/propertyTypes";
import AmenitiesSelector from "@/components/landlord/createProperty/amenities-selector";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import { PAYMENT_METHODS } from "@/constant/paymentMethods";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { FaImage, FaInfoCircle } from "react-icons/fa";

const PropertyMap = dynamic(
    () => import("@/components/landlord/createProperty/propertyMap"),
    { ssr: false }
);

export const StepOneEdit = ({ propertyId }) => {
    const { property, setProperty, photos, setPhotos } = useEditPropertyStore();

    // State
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState({ lat: null, lng: null });
    const [addressQuery, setAddressQuery] = useState("");
    const [addressResults, setAddressResults] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);

    /* =========================================================
       FETCH PROPERTY DETAILS + EXISTING PHOTOS
    ========================================================== */
    useEffect(() => {
        if (!propertyId) return;

        (async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/propertyListing/editProperty?property_id=${propertyId}`
                );
                const data = await res.json();

                if (data?.length > 0) {
                    const p = data[0];

                    const mapped = {
                        propertyName: p.property_name,
                        propertyType: p.property_type,
                        amenities: p.amenities || [],
                        street: p.street,
                        brgyDistrict: p.brgy_district,
                        city: p.city,
                        zipCode: p.zip_code,
                        province: p.province,
                        description: p.description,
                        floorArea: p.floor_area,
                        minStay: p.min_stay,
                        water_billing_type: p.water_billing_type,
                        electricity_billing_type: p.electricity_billing_type,
                        propertyPreferences: p.property_preferences || [],
                        paymentMethodsAccepted: p.accepted_payment_methods || [],
                        lat: p.latitude,
                        lng: p.longitude,
                    };

                    setProperty(mapped);
                    setCoords({ lat: mapped.lat, lng: mapped.lng });
                    setAddressQuery(mapped.street || "");
                }

                /* Existing Photos */
                const photoRes = await axios.get(
                    `/api/propertyListing/propertyPhotos?property_id=${propertyId}`
                );
                const serverPhotos = photoRes.data.map((photo) => ({
                    file: null,
                    preview: photo.photo_url,
                    photo_id: photo.photo_id,
                    isNew: false,
                }));

                setPhotos(serverPhotos);
            } catch (err) {
                console.error("Error:", err);
            }
            setLoading(false);
        })();
    }, [propertyId]);

    /* =========================================================
       ADDRESS SEARCH (Debounced)
    ========================================================== */
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (addressQuery.length < 4) {
                setAddressResults([]);
                return;
            }
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        addressQuery
                    )}&addressdetails=1&countrycodes=ph`
                );
                const data = await res.json();
                setAddressResults(data);
            } catch (err) {
                console.error("Address search failed", err);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [addressQuery]);

    const handleAddressSelect = (place) => {
        const { lat, lon, address, display_name } = place;
        const parsed = {
            lat: parseFloat(lat),
            lng: parseFloat(lon),
            street: address?.road || display_name,
            brgyDistrict: address?.suburb || "",
            city: address?.city || address?.town || "",
            province: address?.region || "",
            zipCode: address?.postcode || "",
        };

        setCoords({ lat: parsed.lat, lng: parsed.lng });
        setProperty({ ...property, ...parsed });
        setAddressQuery(parsed.street);
        setAddressResults([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty({ ...property, [name]: value });
    };

    /* =========================================================
       AMENITIES
    ========================================================== */
    const toggleAmenity = (amenity) => {
        const list = property.amenities || [];
        setProperty({
            ...property,
            amenities: list.includes(amenity)
                ? list.filter((a) => a !== amenity)
                : [...list, amenity],
        });
    };

    /* =========================================================
       PREFERENCES
    ========================================================== */
    const togglePreference = (key) => {
        const list = property.propertyPreferences || [];
        setProperty({
            ...property,
            propertyPreferences: list.includes(key)
                ? list.filter((x) => x !== key)
                : [...list, key],
        });
    };

    /* =========================================================
       PHOTO UPLOAD (Dropzone)
    ========================================================== */
    const onDrop = (acceptedFiles) => {
        const newFiles = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isNew: true,
        }));
        setPhotos([...photos, ...newFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: "image/*",
        multiple: true,
    });

    const removePhoto = async (index) => {
        const p = photos[index];
        if (p.photo_id && !p.isNew) {
            try {
                await axios.delete("/api/propertyListing/deletPropertyPhotos", {
                    data: { photo_id: p.photo_id, property_id: propertyId },
                });
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }
        setPhotos(photos.filter((_, i) => i !== index));
    };

    /* =========================================================
       AI DESCRIPTION BUILDER
    ========================================================== */
    const generateDescription = async () => {
        setLoadingAI(true);

        const prompt = `Generate a rental property description for:
Name: ${property.propertyName}
Type: ${property.propertyType}
Amenities: ${property.amenities?.join(", ")}
Location: ${property.street}, ${property.city}, ${property.province}, ${property.zipCode}.`;

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
                        { role: "system", content: "You write property descriptions." },
                        { role: "user", content: prompt },
                    ],
                }),
            });

            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text) setProperty({ ...property, description: text });
        } catch (err) {
            alert("AI failed to generate text.");
        }

        setLoadingAI(false);
    };

    if (loading) return <p>Loading…</p>;

    /* =========================================================
       FULL PAGE UI — EVERYTHING COMBINED
    ========================================================== */
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 space-y-6">

            {/* PROPERTY TYPE */}
            <div className="bg-white p-4 rounded-2xl shadow-md border space-y-3">
                <label className="font-semibold text-gray-800">Property Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROPERTY_TYPES.map((type) => {
                        const active = property.propertyType === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() =>
                                    setProperty({ ...property, propertyType: type.value })
                                }
                                className={`p-4 rounded-xl shadow-sm ${
                                    active
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                        : "bg-white border"
                                }`}
                            >
                                <span className="text-2xl">{type.icon}</span>
                                <p className="text-sm">{type.label}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PROPERTY NAME */}
            <div className="bg-white p-4 rounded-2xl shadow">
                <label className="font-semibold text-gray-800 mb-2">Property Name</label>
                <input
                    type="text"
                    name="propertyName"
                    value={property.propertyName || ""}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg"
                />
            </div>

            {/* MAP */}
            <div className="bg-white p-4 rounded-2xl shadow">
                <label className="font-semibold text-gray-800 mb-2">
                    Property Location
                </label>
                <PropertyMap
                    coordinates={coords.lat && coords.lng ? [coords.lat, coords.lng] : null}
                    setFields={({ lat, lng, address, barangay, city, province, postcode }) => {
                        setCoords({ lat, lng });
                        setProperty({
                            ...property,
                            lat,
                            lng,
                            street: address,
                            brgyDistrict: barangay,
                            city,
                            province,
                            zipCode: postcode,
                        });
                        setAddressQuery(address);
                    }}
                />
            </div>

            {/* ADDRESS SEARCH */}
            <div className="bg-white p-4 rounded-2xl shadow relative">
                <label className="font-semibold text-gray-800 mb-2">Street</label>
                <input
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                />

                {addressResults.length > 0 && (
                    <ul className="absolute bg-white border rounded-lg mt-1 w-full max-h-60 overflow-auto z-10 shadow">
                        {addressResults.map((item, i) => (
                            <li
                                key={i}
                                onClick={() => handleAddressSelect(item)}
                                className="p-2 hover:bg-blue-50 cursor-pointer"
                            >
                                {item.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Auto-Filled */}
            <div className="bg-white p-4 rounded-2xl shadow grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                    readOnly
                    value={property.brgyDistrict || ""}
                    className="bg-gray-100 p-3 rounded-lg border"
                    placeholder="Barangay"
                />
                <input
                    name="city"
                    onChange={handleChange}
                    value={property.city || ""}
                    className="p-3 rounded-lg border"
                    placeholder="City"
                />
                <input
                    name="zipCode"
                    onChange={handleChange}
                    value={property.zipCode || ""}
                    className="p-3 rounded-lg border"
                    placeholder="ZIP Code"
                />
                <input
                    readOnly
                    value={property.province || ""}
                    className="bg-gray-100 p-3 rounded-lg border"
                    placeholder="Province"
                />
            </div>

            {/* AMENITIES */}
            <div className="bg-white p-4 rounded-2xl shadow">
                <h2 className="font-semibold text-gray-800 mb-2">Amenities</h2>
                <AmenitiesSelector
                    selectedAmenities={property.amenities || []}
                    onAmenityChange={toggleAmenity}
                />
            </div>

            {/* DESCRIPTION + AI */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-2">
                <label className="font-semibold">Description</label>
                <textarea
                    name="description"
                    rows={5}
                    onChange={handleChange}
                    value={property.description || ""}
                    className="w-full p-3 border rounded-lg"
                />
                <button
                    type="button"
                    onClick={generateDescription}
                    className="text-blue-600 font-medium"
                >
                    {loadingAI ? "Generating…" : "✨ Generate with AI"}
                </button>
            </div>

            {/* FLOOR AREA */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-1">
                <label className="font-semibold">Total Property Size (sqm)</label>
                <input
                    type="number"
                    name="floorArea"
                    value={property.floorArea || ""}
                    onChange={handleChange}
                    className="p-3 border rounded-lg w-full"
                />
            </div>

            {/* PREFERENCES */}
            <div className="bg-white p-4 rounded-2xl shadow space-y-3">
                <h2 className="font-semibold">Property Preferences</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROPERTY_PREFERENCES.map((pref) => {
                        const Icon = pref.icon;
                        const active = property.propertyPreferences?.includes(pref.key);
                        return (
                            <button
                                key={pref.key}
                                type="button"
                                onClick={() => togglePreference(pref.key)}
                                className={`p-4 rounded-xl border shadow-sm ${
                                    active
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                        : ""
                                }`}
                            >
                                <Icon className="text-xl mb-1" />
                                <p className="text-sm">{pref.label}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* UTILITY BILLING */}
            <div className="bg-white p-4 rounded-2xl shadow grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="font-semibold flex items-center gap-1">
                        Water Billing <FaInfoCircle className="text-blue-500" />
                    </label>
                    <select
                        name="water_billing_type"
                        onChange={handleChange}
                        value={property.water_billing_type || ""}
                        className="w-full p-3 border rounded-lg"
                    >
                        <option value="">Select type</option>
                        {UTILITY_BILLING_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="font-semibold flex items-center gap-1">
                        Electricity Billing <FaInfoCircle className="text-blue-500" />
                    </label>
                    <select
                        name="electricity_billing_type"
                        onChange={handleChange}
                        value={property.electricity_billing_type || ""}
                        className="w-full p-3 border rounded-lg"
                    >
                        <option value="">Select type</option>
                        {UTILITY_BILLING_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* PHOTO UPLOAD */}
            <div className="bg-white p-4 rounded-2xl shadow">
                <h2 className="font-semibold mb-2">Property Photos</h2>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed p-10 rounded-xl text-center cursor-pointer ${
                        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                >
                    <input {...getInputProps()} />
                    <FaImage className="text-blue-500 text-4xl mb-3 mx-auto" />
                    <p className="text-gray-600">Drag or upload images</p>
                </div>

                {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {photos.map((photo, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={photo.preview}
                                    className="w-full h-40 object-cover rounded-xl"
                                />
                                <button
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white
                     w-6 h-6 rounded-full flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PAYMENT METHODS */}
            <div className="bg-white p-4 rounded-2xl shadow">
                <h2 className="font-semibold mb-2">Payment Methods Accepted</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((m) => (
                        <label
                            key={m.key}
                            className="flex items-center gap-3 border p-3 rounded-xl shadow-sm cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={property.paymentMethodsAccepted?.includes(m.key)}
                                onChange={() =>
                                    setProperty({
                                        ...property,
                                        paymentMethodsAccepted: property.paymentMethodsAccepted?.includes(
                                            m.key
                                        )
                                            ? property.paymentMethodsAccepted.filter((x) => x !== m.key)
                                            : [...(property.paymentMethodsAccepted || []), m.key],
                                    })
                                }
                            />
                            <span>{m.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};
