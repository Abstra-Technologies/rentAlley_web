import { create } from "zustand";
import axios from "axios";

// Define proper types
interface PropertyData {
  propertyName: string;
  propertyType: string;
  amenities: string[];
  street: string;
  brgyDistrict: number;
  city: string;
  zipCode: number;
  province: string;
  propDesc: string;
  floorArea: number;
  utilityBillingType: string;
  minStay: number;
  secDeposit: number;
  advancedPayment: number;
  lateFee: number;
  assocDues: number;
  paymentFrequency: number;
  bedSpacing: number;
  availBeds: number;
  flexiPayEnabled: number;
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
  mayorPermit: File | null;
  occPermit: File | null;
  indoorPhoto: File | null;
  outdoorPhoto: File | null;
  propTitle: File | null;
  selectedProperty: any;
  loading: boolean;
  error: string | null;

  setProperty: (propertyDetails: Partial<PropertyData>) => void;
  toggleAmenity: (amenity: string) => void;
  fetchAllProperties: (landlordId: string | number) => Promise<void>;
  updateProperty: (id: string | number, updatedData: any) => void;
  setPhotos: (photos: any[]) => void;
  setMayorPermit: (file: File | null) => void;
  setOccPermit: (file: File | null) => void;
  setIndoorPhoto: (file: File | null) => void;
  setOutdoorPhoto: (file: File | null) => void;
  setGovID: (file: File | null) => void;
  setPropTitle: (file: File | null) => void;
  setSelectedProperty: (property: any) => void;
  reset: () => void;
}

const initialPropertyState: PropertyData = {
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
  paymentMethodsAccepted: [],
  propertyPreferences: [],
  lat: 0,
  lng: 0,
};

const usePropertyStore = create<PropertyStore>()((set, get) => ({
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
  setProperty: (propertyDetails: Partial<PropertyData>) =>
    set((state: PropertyStore) => ({
      property: {
        ...state.property,
        ...propertyDetails,
      },
    })),

  // Toggle an amenity
  toggleAmenity: (amenity: string) =>
    set((state: PropertyStore) => {
      const amenities = state.property.amenities || [];
      const exists = amenities.includes(amenity);
      return {
        property: {
          ...state.property,
          amenities: exists
            ? amenities.filter((a: string) => a !== amenity)
            : [...amenities, amenity],
        },
      };
    }),

  fetchAllProperties: async (landlordId) => {
    set({ loading: true, error: null });

    try {
      // Fetch all properties and only the first photo for each property
      const [propertiesRes, photosRes] = await Promise.all([
        axios.get(`/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`),
        axios.get("/api/propertyListing/propertyPhotos"),
      ]);

      // Ensure each property gets its correct first photo
      const propertiesWithPhotos = propertiesRes.data.map((property) => {
        const propertyPhoto = photosRes.data.find(
            (photo) => photo.property_id === property.property_id
        );

        return {
          ...property,
          photos: propertyPhoto ? [propertyPhoto] : [],
        };
      });

      set({ properties: propertiesWithPhotos, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  updateProperty: (id: string | number, updatedData: any) =>
    set((state: PropertyStore) => ({
      properties: state.properties.map((p: any) =>
        p.property_id === id ? { ...p, ...updatedData } : p
      ),
    })),

  setPhotos: (photos: any[]) => set({ photos }),
  setMayorPermit: (file: File | null) => set({ mayorPermit: file }),
  setOccPermit: (file: File | null) => set({ occPermit: file }),
  setIndoorPhoto: (file: File | null) => set({ indoorPhoto: file }),
  setOutdoorPhoto: (file: File | null) => set({ outdoorPhoto: file }),
  setGovID: (file: File | null) => set({ govID: file }),
  setPropTitle: (file: File | null) => set({ propTitle: file }),
  setSelectedProperty: (property: any) => set({ selectedProperty: property }),

  reset: () =>
    set(() => ({
      property: { ...initialPropertyState },
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
