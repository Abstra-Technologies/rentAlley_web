"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface PropertyData {
    propertyName: string;
    propertyType: string;
    amenities: string[];
    street: string;
    brgyDistrict: string;
    city: string;
    zipCode: number | string;
    province: string;
    propDesc: string;
    floorArea: number;

    waterBillingType: string;
    electricityBillingType: string;

    rentIncreasePercent: number;

    propertyPreferences: string[];

    latitude: number | null;
    longitude: number | null;
}

interface PropertyStore {
    // CREATE PROPERTY
    property: PropertyData;
    photos: any[];

    // LISTING PROPERTIES
    properties: any[];
    selectedProperty: any;
    loading: boolean;
    error: string | null;

    // VERIFICATION DOCS
    docType: string;
    submittedDoc: File | null;
    govID: File | null;
    indoorPhoto: File | null;
    outdoorPhoto: File | null;

    // METHODS
    setProperty: (details: Partial<PropertyData>) => void;
    toggleAmenity: (amenity: string) => void;

    setPhotos: (photos: any[]) => void;
    setSubmittedDoc: (file: File | null) => void;
    setGovID: (file: File | null) => void;
    setIndoorPhoto: (file: File | null) => void;
    setOutdoorPhoto: (file: File | null) => void;
    setDocType: (type: string) => void;

    fetchAllProperties: (landlordId: string | number) => Promise<void>;
    updateProperty: (id: string | number, updatedData: any) => void;
    setSelectedProperty: (property: any) => void;

    reset: () => void;
}

const initialPropertyState: PropertyData = {
    propertyName: "",
    propertyType: "",
    amenities: [],
    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: "",
    province: "",
    propDesc: "",
    floorArea: 0,

    waterBillingType: "",
    electricityBillingType: "",

    rentIncreasePercent: 0,

    propertyPreferences: [],

    latitude: null,
    longitude: null,
};

const usePropertyStore = create<PropertyStore>()(
    persist(
        (set, get) => ({
            /** ================================
             *  CREATE PROPERTY STATE
             * ================================= */
            property: { ...initialPropertyState },
            photos: [],

            /** ================================
             *  PROPERTY LISTING
             * ================================= */
            properties: [],
            selectedProperty: null,
            loading: false,
            error: null,

            /** ================================
             *  VERIFICATION DOCS
             * ================================= */
            submittedDoc: null,
            govID: null,
            indoorPhoto: null,
            outdoorPhoto: null,
            docType: "business_permit",

            /** ================================
             *  SETTERS
             * ================================= */
            setProperty: (details) =>
                set((state) => ({
                    property: { ...state.property, ...details },
                })),

            toggleAmenity: (amenity) =>
                set((state) => {
                    const exists = state.property.amenities.includes(amenity);
                    return {
                        property: {
                            ...state.property,
                            amenities: exists
                                ? state.property.amenities.filter((a) => a !== amenity)
                                : [...state.property.amenities, amenity],
                        },
                    };
                }),

            setPhotos: (photos) => set({ photos }),
            setSubmittedDoc: (file) => set({ submittedDoc: file }),
            setGovID: (file) => set({ govID: file }),
            setIndoorPhoto: (file) => set({ indoorPhoto: file }),
            setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
            setDocType: (type) => set({ docType: type }),

            /** ================================
             *  FETCH PROPERTIES FOR LANDLORD
             * ================================= */
            fetchAllProperties: async (landlordId) => {
                set({ loading: true, error: null });

                try {
                    const [propertiesRes, photosRes] = await Promise.all([
                        axios.get(
                            `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
                        ),
                        axios.get(`/api/propertyListing/propertyPhotos`)
                    ]);

                    const properties = propertiesRes.data || [];
                    const photos = photosRes.data || [];

                    const combined = properties.map((p: any) => {
                        const matchedPhotos = photos.filter(
                            (photo: any) => photo.property_id === p.property_id
                        );
                        return { ...p, photos: matchedPhotos };
                    });

                    set({ properties: combined, loading: false });
                } catch (err: any) {
                    set({
                        error: err?.message || "Failed to fetch properties",
                        loading: false,
                    });
                }
            },

            /** ================================
             *  UPDATE PROPERTY LOCALLY
             * ================================= */
            updateProperty: (id, updatedData) =>
                set((state) => ({
                    properties: state.properties.map((p: any) =>
                        p.property_id === id ? { ...p, ...updatedData } : p
                    ),
                })),

            setSelectedProperty: (property) => set({ selectedProperty: property }),

            /** ================================
             *  RESET STORE
             * ================================= */
            reset: () =>
                set({
                    property: { ...initialPropertyState },
                    photos: [],
                    submittedDoc: null,
                    govID: null,
                    indoorPhoto: null,
                    outdoorPhoto: null,
                    docType: "business_permit",
                }),
        }),
        {
            name: "property-store",
            partialize: (state) => ({
                property: state.property,
                properties: state.properties,
                selectedProperty: state.selectedProperty,
                photos: state.photos,
            }),
        }
    )
);

export default usePropertyStore;
