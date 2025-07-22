
import { create } from "zustand";
import { fetchAllProperties } from "./fetchAllProperties";

const initialPropertyState = {
  propertyName: "",
  propertyType: "",
  amenities: [],
  street: "",
  brgyDistrict: 0,
  city: "",
  zipCode: 0,
  province: "",
  propDesc: "",
  floorArea: 0,
  totalUnits: "",
  utilityBillingType: "",
  minStay: 0,
  secDeposit: 0,
  advancedPayment: 0,
  lateFee: 0,
  assocDues: 0,
  paymentFrequency: 0,
  bedSpacing: 0,
  availBeds: 0,
  flexiPayEnabled: 0,
  paymentMethodsAccepted:[] ,
  propertyPreferences:[],
  lat: 0,
  lng: 0,
};

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const usePropertyStore = create((set) => ({
  property: { ...initialPropertyState },
  photos: [],
  properties: [],
  propertyTypes: [],
  govID: null,
  mayorPermit: null,
  occPermit: null,
  indoorPhoto: null,
  outdoorPhoto: null,
  propTitle: null,
  selectedProperty: null,
  loading: false,
  error: null,

  // Setter for property fields
    // @ts-ignore

    setProperty: (propertyDetails) =>
        // @ts-ignore
        set((state) => ({
      property: {
        ...state.property,
        ...propertyDetails,
      },
    })),

  // Toggle an amenity
    // @ts-ignore
    toggleAmenity: (amenity) =>
        // @ts-ignore
    set((state) => {
      const amenities = state.property.amenities || [];
      const exists = amenities.includes(amenity);
      return {
        property: {
          ...state.property,
          amenities: exists
              // @ts-ignore
            ? amenities.filter((a) => a !== amenity)
            : [...amenities, amenity],
        },
      };
    }),

  // Fetch properties with photos (external handler)
    // @ts-ignore
  fetchAllProperties: (landlordId) => fetchAllProperties(landlordId, set),

  // Update a property in the list
    // @ts-ignore
  updateProperty: (id, updatedData) =>
      // @ts-ignore
    set((state) => ({
        // @ts-ignore
      properties: state.properties.map((p) =>
        p.property_id === id ? { ...p, ...updatedData } : p
      ),
    })),

  // Simple setters
    // @ts-ignore
  setPhotos: (photos) => set({ photos }),
    // @ts-ignore
  setMayorPermit: (file) => set({ mayorPermit: file }),
    // @ts-ignore
  setOccPermit: (file) => set({ occPermit: file }),
    // @ts-ignore
  setIndoorPhoto: (file) => set({ indoorPhoto: file }),
    // @ts-ignore
  setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
    // @ts-ignore
  setGovID: (file) => set({ govID: file }),
    // @ts-ignore
  setPropTitle: (file) => set({ propTitle: file }),
    // @ts-ignore
  setSelectedProperty: (property) => set({ selectedProperty: property }),

  // Reset store
  reset: () =>
      // @ts-ignore
    set((state) => ({
      property: {
        ...initialPropertyState,
        propertyType: state.propertyTypes[0] || "",
      },
      photos: [],
      mayorPermit: null,
      occPermit: null,
      indoorPhoto: null,
      outdoorPhoto: null,
      govID: null,
      propTitle: null,
    })),
}));

export default usePropertyStore;
