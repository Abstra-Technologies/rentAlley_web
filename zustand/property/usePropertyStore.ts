
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
  propertyPreferences:[]
};

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

  // Fetch properties with photos (external handler)
  fetchAllProperties: (landlordId) => fetchAllProperties(landlordId, set),

  // Update a property in the list
  updateProperty: (id, updatedData) =>
    set((state) => ({
      properties: state.properties.map((p) =>
        p.property_id === id ? { ...p, ...updatedData } : p
      ),
    })),

  // Simple setters
  setPhotos: (photos) => set({ photos }),
  setMayorPermit: (file) => set({ mayorPermit: file }),
  setOccPermit: (file) => set({ occPermit: file }),
  setIndoorPhoto: (file) => set({ indoorPhoto: file }),
  setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
  setGovID: (file) => set({ govID: file }),
  setPropTitle: (file) => set({ propTitle: file }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),

  // Reset store
  reset: () =>
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
