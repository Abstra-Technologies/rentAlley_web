// Types
export interface Unit {
  unit_id: string;
  unit_name: string;
  unit_style:
    | "studio"
    | "1-bedroom"
    | "2-bedroom"
    | "3-bedroom"
    | "loft"
    | "duplex"
    | "penthouse"
    | "dorm"
    | "others";
  unit_size: number;
  rent_amount: number;
  furnish: string;
  bed_spacing: number;
  avail_beds: number;
  sec_deposit: number;
  advanced_payment: number;
  amenities: string;
  photos: string[];
  effective_status: string;
  property_id: string;
  property_name: string;
  property_type: string;
  city: string;
  province: string;
  street: string;
  latitude?: number;
  longitude?: number;
  flexipay_enabled: number;
  landlord_id: string;
  status: "occupied" | "unoccupied" | "inactive" | "archived";
}

export interface FilterState {
  searchQuery?: string;
  propertyType?: string;
  furnishing?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  location?: string;
  unitStyle?: string;
}
