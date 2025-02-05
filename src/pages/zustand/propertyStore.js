import { create } from "zustand";

// Define the Zustand store
const usePropertyStore = create((set) => ({
  property: {
    propertyName: "",
    propDesc: "",
    floorArea: 0,
    propertyType: "",
    amenities: [],
    bedSpacing: false,
    availBeds: 0,
    petFriendly: false,
    unit: "",
    street: "",
    brgyDistrict: 0,
    city: "",
    zipCode: 0,
    province: "",
    minStay: 0,
    secDeposit: 0,
    advancedPayment: 0,
    furnish: "",
    propertyStatus: "unoccupied",
    hasElectricity: false,
    hasWater: false,
    hasAssocDues: false,
    rentPayment: 0.0,
    lateFee: 0.0,
  },
  photos: [],
  propertyTypes: [],
  // Set property details
  setProperty: (propertyDetails) =>
    set((state) => ({ property: { ...state.property, ...propertyDetails } })),
  // Add or remove amenities (toggle function)
  toggleAmenity: (amenity) =>
    set((state) => ({
      property: {
        ...state.property,
        amenities: state.property.amenities.includes(amenity)
          ? state.property.amenities.filter((a) => a !== amenity) // Remove if exists
          : [...state.property.amenities, amenity], // Add if not exists
      },
    })),
  // Set uploaded photos
  setPhotos: (photos) => set({ photos }),
  // Reset state
  reset: () =>
    set({
      property: {
        propertyName: "",
        propDesc: "",
        floorArea: 0,
        propertyType: state.propertyTypes[0] || "",
        amenities: [],
        bedSpacing: false,
        availBeds: 0,
        petFriendly: false,
        unit: "",
        street: "",
        brgyDistrict: 0,
        city: "",
        zipCode: 0,
        province: "",
        minStay: 0,
        secDeposit: 0,
        advancedPayment: 0,
        furnish: "",
        propertyStatus: "unoccupied",
        hasElectricity: false,
        hasWater: false,
        hasAssocDues: false,
        rentPayment: 0.0,
        lateFee: 0.0,
      },
      photos: [],
    }),
}));

export default usePropertyStore;
