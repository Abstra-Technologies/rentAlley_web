export interface Unit {
  unit_id: string;
  property_id: string;
  property_name: string;
  unit_name: string;
  property_type: string;
  property_photo: string;
  photos: string[];
  city: string;
  province: string;
  rent_amount: number;
  unit_size: number;
  bed_spacing: number;
  furnish: string;
  avail_beds: number;
  flexipay_enabled: number;
}

export interface TrustIndicator {
  icon: any;
  text: string;
  subtext: string;
}

export interface CommunityFeature {
  icon: string;
  label: string;
  color: string;
}
