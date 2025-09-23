
import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialEditPropertyState = {
    propertyName: "",
    propertyType: "",
    amenities: [],
    street: "",
    brgyDistrict: "",
    city: "",
    zipCode: "",
    province: "",
    description: "",
    floorArea: 0,
    waterBillingType: "",
    electricityBillingType: "",
    minStay: 0,
    secDeposit: 0,
    advancedPayment: 0,
    lateFee: 0,
    assocDues: 0,
    paymentFrequency: 0,
    bedSpacing: 0,
    availBeds: 0,
    flexiPayEnabled: 0,
    paymentMethodsAccepted: [],
    propertyPreferences: [],
    lat: 0,
    lng: 0,
};

// @ts-ignore
const useEditPropertyStore = create(
    persist(
        (set) => ({
            property: { ...initialEditPropertyState },
            photos: [],
            loading: false,
            error: null,

            // Set or merge property fields
            setProperty: (propertyDetails) =>
                set((state) => ({
                    property: {
                        ...state.property,
                        ...propertyDetails,
                    },
                })),

            // Toggle an amenity
            toggleAmenity: (amenity) =>
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

            // Set photos/files individually
            setPhotos: (photos) => set({ photos }),

            // Reset state
            reset: () =>
                set(() => ({
                    property: { ...initialEditPropertyState },
                    photos: [],
                    loading: false,
                    error: null,
                })),
        }),
        {
            name: "edit-property-store", // 🔑 localStorage key
            partialize: (state) => ({
                property: state.property,
                photos: state.photos,
            }),
        }
    )
);

export default useEditPropertyStore;

