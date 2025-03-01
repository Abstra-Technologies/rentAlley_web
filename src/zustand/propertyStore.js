import axios from "axios";
import { create } from "zustand";

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
    bedSpacing: 0,
    availBeds: 0,
    petFriendly: 0,
    numberOfUnit: "",
    street: "",
    brgyDistrict: 0,
    city: "",
    zipCode: 0,
    province: "",
    minStay: 0,
    secDeposit: 0,
    advancedPayment: 0,
    hasElectricity: 0,
    hasWater: 0,
    hasAssocDues: 0,
    rentPayment: 0.0,
    lateFee: 0.0,
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
      const amenities = state.property.amenities || [];
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
      // Fetch all properties and only the first photo for each property
      const [propertiesRes, photosRes] = await Promise.all([
        axios.get(`/api/propertyListing/propListing?landlord_id=${landlordId}`), // Fetch properties
        axios.get("/api/propertyListing/propPhotos"), // Fetch first property photos
      ]);

      // Ensure each property gets its correct first photo
      const propertiesWithPhotos = propertiesRes.data.map((property) => {
        const propertyPhoto = photosRes.data.find(
          (photo) => photo.property_id === property.property_id
        );

        return {
          ...property,
          photos: propertyPhoto ? [propertyPhoto] : [], // Only assign first photo
        };
      });

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
  //  property photos
  setPhotos: (photos) => set({ photos }),
  //  verification property documents
  setMayorPermit: (file) => set({ mayorPermit: file }),
  setOccPermit: (file) => set({ occPermit: file }),
  setIndoorPhoto: (file) => set({ indoorPhoto: file }),
  setOutdoorPhoto: (file) => set({ outdoorPhoto: file }),
  setGovID: (file) => set({ govID: file }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
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
        numberOfUnit: "",
        street: "",
        brgyDistrict: 0,
        city: "",
        zipCode: 0,
        province: "",
        minStay: 0,
        secDeposit: 0,
        advancedPayment: 0,
        hasElectricity: 0,
        hasWater: 0,
        hasAssocDues: 0,
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
