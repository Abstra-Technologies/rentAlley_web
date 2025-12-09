import { CheckCircle2, Award, Clock } from "lucide-react";
import { TrustIndicator, CommunityFeature } from "@/types/landing";

export const POPULAR_CITIES = [
  "Manila",
  "Quezon City",
  "Makati",
  "Taguig",
  "Pasig",
];

export const TRUST_INDICATORS: TrustIndicator[] = [
  { icon: CheckCircle2, text: "Verified", subtext: "Listings" },
  { icon: Award, text: "Secure", subtext: "Platform" },
  { icon: Clock, text: "24/7", subtext: "Support" },
];

export const COMMUNITY_FEATURES: CommunityFeature[] = [
  {
    icon: "✓",
    label: "Verified Listings",
    color: "from-emerald-500 to-emerald-600",
  },
  { icon: "₱", label: "Fair Pricing", color: "from-blue-500 to-blue-600" },
  {
    icon: "🤝",
    label: "Reliable Support",
    color: "from-purple-500 to-purple-600",
  },
];
