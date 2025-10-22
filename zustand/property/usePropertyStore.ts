

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

// Define proper types
interface PropertyData {
    propertyName: string;
    propertyType: string;
    amenities: string[];
    street: string;
    brgyDistrict: string; // DB: varchar(100)
    city: string;
    zipCode: number;
    province: string;
    propDesc: string;
    floorArea: number;

    // 🔑 Billing types
    waterBillingType: string;
    electricityBillingType: string;

    minStay: number;
    securityDepositMonths: number;
    advancePaymentMonths: number;
    rentIncreasePercent: number;

    flexiPayEnabled: boolean;
    paymentMethodsAccepted: string[];
    propertyPreferences: string[];
    lat: number;
    lng: number;
}

interface PropertyStore {
    property: PropertyData;
    photos: any[];
    properties: any[];
    propertyTypes: any[];
    govID: File | null;
    submittedDoc: File | null;
    docType: string;
    indoorPhoto: File | null;
    outdoorPhoto: File | null;
    selectedProperty: any;
    loading: boolean;
    error: string | null;

    setProperty: (propertyDetails: Partial<PropertyData>) => void;
    toggleAmenity: (amenity: string) => void;
    fetchAllProperties: (landlordId: string | number) => Promise<void>;
    updateProperty: (id: string | number, updatedData: any) => void;
    setPhotos: (photos: any[]) => void;
    setSubmittedDoc: (file: File | null) => void;
    setDocType: (type: string) => void;
    setIndoorPhoto: (file: File | null) => void;
    setOutdoorPhoto: (file: File | null) => void;
    setGovID: (file: File | null) => void;
    setSelectedProperty: (property: any) => void;
    reset: () => void;
}

// Initial property state
const initialPropertyState: PropertyData = {
    propertyName: "",
    propertyType: "",
    amenities: [],
    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: 0,
    province: "",
    propDesc: "",
    floorArea: 0,

    waterBillingType: "",
    electricityBillingType: "",

    minStay: 0,
    securityDepositMonths: 0,
    advancePaymentMonths: 0,
    rentIncreasePercent: 0,

    flexiPayEnabled: false,
    paymentMethodsAccepted: [],
    propertyPreferences: [],
    lat: 0,
    lng: 0,
};

const usePropertyStore = create<PropertyStore>()(
    persist(
        (set, get) => ({
            property: { ...initialPropertyState },
            photos: [],
            properties: [],
            propertyTypes: [],
            govID: null,
            submittedDoc: null,
            docType: "business_permit",
            indoorPhoto: null,
            outdoorPhoto: null,
            selectedProperty: null,
            loading: false,
            error: null,

            setProperty: (propertyDetails: Partial<PropertyData>) =>
                set((state) => ({
                    property: { ...state.property, ...propertyDetails },
                })),

            toggleAmenity: (amenity: string) =>
                set((state) => {
                    const amenities = state.property.amenities || [];
                    const exists = amenities.includes(amenity);
                    return {
                        property: {
                            ...state.property,
                            amenities: exists
                                ? amenities.filter((a) => a !== amenity)
                                : [...amenities, amenity],
                        },
                    };
                }),

            fetchAllProperties: async (landlordId) => {
                set({ loading: true, error: null });
                try {
                    const [propertiesRes, photosRes] = await Promise.all([
                        axios.get(
                            `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
                        ),
                        axios.get("/api/propertyListing/propertyPhotos"),
                    ]);

                    const propertiesWithPhotos = propertiesRes.data.map((property: any) => {
                        const propertyPhoto = photosRes.data.find(
                            (photo: any) => photo.property_id === property.property_id
                        );
                        return {
                            ...property,
                            photos: propertyPhoto ? [propertyPhoto] : [],
                        };
                    });

                    set({ properties: propertiesWithPhotos, loading: false });
                } catch (err: any) {
                    set({ error: err.message, loading: false });
                }
            },

            updateProperty: (id, updatedData) =>
                set((state) => ({
                    properties: state.properties.map((p: any) =>
                        p.property_id === id ? { ...p, ...updatedData } : p
                    ),
                })),

            setPhotos: (photos) => set({ photos }),
            setSubmittedDoc: (file) => set({ submittedDoc: file }),
            setDocType: (type) => set({ docType: type }),
            setIndoorPhoto: (file) => set({ indoorPhoto: file }),
            setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
            setGovID: (file) => set({ govID: file }),
            setSelectedProperty: (property) => set({ selectedProperty: property }),

            reset: () =>
                set(() => ({
                    property: { ...initialPropertyState },
                    photos: [],
                    submittedDoc: null,
                    docType: "business_permit",
                    indoorPhoto: null,
                    outdoorPhoto: null,
                    govID: null,
                })),
        }),
        {
            name: "property-store",
            partialize: (state) => ({
                property: state.property,
                photos: state.photos,
                properties: state.properties,
                propertyTypes: state.propertyTypes,
                selectedProperty: state.selectedProperty,
                govID: state.govID,
                submittedDoc: state.submittedDoc,
                docType: state.docType,
                indoorPhoto: state.indoorPhoto,
                outdoorPhoto: state.outdoorPhoto,
            }),
        }
    )
);

export default usePropertyStore;