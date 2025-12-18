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
    water_billing_type: "",
    electricity_billing_type: "",
    minStay: 0,
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
            /* =======================
               STATE
            ======================= */
            property: { ...initialEditPropertyState },
            photos: [],
            loading: false,
            error: null,

            /* =======================
               ACTIONS
            ======================= */

            // Merge property fields safely
            setProperty: (propertyDetails) =>
                set((state) => ({
                    property: {
                        ...state.property,
                        ...propertyDetails,
                    },
                })),

            // Toggle amenity
            toggleAmenity: (amenity) =>
                set((state) => {
                    const amenities = Array.isArray(state.property.amenities)
                        ? state.property.amenities
                        : [];

                    return {
                        property: {
                            ...state.property,
                            amenities: amenities.includes(amenity)
                                ? amenities.filter((a) => a !== amenity)
                                : [...amenities, amenity],
                        },
                    };
                }),

            // ✅ ALWAYS normalize photos to array
            setPhotos: (photos) =>
                set({
                    photos: Array.isArray(photos) ? photos : [],
                }),

            // ✅ Remove single photo safely (for DELETE)
            removePhoto: (photoId) =>
                set((state) => ({
                    photos: state.photos.filter(
                        (photo) => photo.photo_id !== photoId
                    ),
                })),

            // Reset everything
            reset: () =>
                set({
                    property: { ...initialEditPropertyState },
                    photos: [],
                    loading: false,
                    error: null,
                }),
        }),
        {
            name: "edit-property-store",

            // Persist only what matters
            partialize: (state) => ({
                property: state.property,
                photos: state.photos,
            }),
        }
    )
);

export default useEditPropertyStore;
