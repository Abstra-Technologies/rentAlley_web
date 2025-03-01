import axios from "axios";
import { create } from "zustand";

// Define the Zustand store
const usePropertyStore = create((set) => ({
  property: {
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
    petFriendly: 0,
    totalUnits: "",
    street: "",
    brgyDistrict: 0,
    city: "",
    zipCode: 0,
    province: "",
    utilityBillingType: "",
    minStay: 0,
    secDeposit: 0,
    advancedPayment: 0,
    lateFee: 0,
    assocDues: 0,
    secDeposit: 0,
    paymentFrequency: 0,
  },
  photos: [],
  propertyTypes: [],
  govID: null,
  mayorPermit: null,
  occPermit: null,
  indoorPhoto: null,
  outdoorPhoto: null,
  selectedProperty: null,
  properties: [],
  loading: false,
  error: null,
  // Set property details
  setProperty: (propertyDetails) =>
    set((state) => ({
      property: {
        ...state.property,
        ...propertyDetails,
      },
    })),
  // Add or remove amenities (toggle function)
  toggleAmenity: (amenity) => {
    set((state) => {
      const amenities = state.property.amenities || []; // Ensure amenities is an array
      const amenityIndex = amenities.indexOf(amenity);
      let newAmenities;

      if (amenityIndex > -1) {
        // Amenity already exists, so remove it
        newAmenities = [
          ...amenities.slice(0, amenityIndex),
          ...amenities.slice(amenityIndex + 1),
        ];
      } else {
        // Amenity doesn't exist, so add it
        newAmenities = [...amenities, amenity];
      }

      return {
        property: {
          ...state.property,
          amenities: newAmenities,
        },
      };
    });
  },
  // Fetch property details and photos
  fetchAllProperties: async (landlordId) => {
    set({ loading: true, error: null });

    try {
      // Fetch all properties and their full details
      const [propertiesRes, photosRes] = await Promise.all([
        axios.get(`/api/propertyListing/propListing?landlord_id=${landlordId}`), // Fetch properties
        axios.get("/api/propertyListing/propPhotos"), // Fetch property photos
      ]);

      // Create a lookup table for photos based on `property_id`
      const photoMap = {};
      photosRes.data.forEach((photoData) => {
        if (!photoMap[photoData.property_id]) {
          photoMap[photoData.property_id] = [];
        }
        if (photoData.firstPhoto) {
          photoMap[photoData.property_id].push(photoData.firstPhoto);
        }
      });

      // Merge properties with their corresponding photos
      const propertiesWithPhotos = propertiesRes.data.map((property) => ({
        ...property,
        photos: photoMap[property.property_id] || [], // Assign all decrypted photos
      }));

      console.log("Properties with Photos:", propertiesWithPhotos);

      set({ properties: propertiesWithPhotos, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  updateProperty: (id, updatedData) =>
    set((state) => ({
      properties: state.properties.map((p) =>
        p.property_id === id ? { ...p, ...updatedData } : p
      ),
    })),
  // Set uploaded photos
  setPhotos: (photos) => set({ photos }),
  // Set Document Files
  setMayorPermit: (file) => set({ mayorPermit: file }),
  setOccPermit: (file) => set({ occPermit: file }),
  // Set Indoor Photo File
  setIndoorPhoto: (file) => set({ indoorPhoto: file }),
  // Set Outdoor Photo File
  setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
  setGovID: (file) => set({ govID: file }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  // Reset state
  reset: () =>
    set((state) => ({
      property: {
        propertyName: "",
        propertyType: state.propertyTypes[0] || "",
        amenities: [],
        street: "",
        brgyDistrict: 0,
        city: "",
        zipCode: 0,
        province: "",
        propDesc: "",
        floorArea: 0,
        bedSpacing: 0,
        availBeds: 0,
        petFriendly: 0,
        totalUnits: "",
        utilityBillingType: "",
        street: "",
        brgyDistrict: 0,
        city: "",
        zipCode: 0,
        province: "",
        minStay: 0,
        secDeposit: 0,
        assocDues: 0,
        paymentFrequency: 0,
        advancedPayment: 0,
        rentPayment: 0.0,
        lateFee: 0.0,
      },
      photos: [],
      mayorPermit: null,
      occPermit: null,
      indoorPhoto: null,
      outdoorPhoto: null,
      govID: null,
    })),
}));

export default usePropertyStore;
