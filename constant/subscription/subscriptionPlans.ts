// constants/subscriptionPlans.ts

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    trialDays: number;
    popular: boolean;
    features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 1,
        name: "Free Plan",
        price: 0,
        trialDays: 0,
        popular: false,
        features: [
            "1 Property",
            "10 Unit Listings",
            "10 Maintenance Requests",
            "Mobile Access",
            "Limited to 3 Prospective per unit.",
            "Limited to 10 Billing Units",
        ],
    },
    {
        id: 2,
        name: "Standard Plan",
        price: 500,
        trialDays: 10,
        popular: true,
        features: [
            "Up to 5 Properties",
            "Up to 10 Property Listings",
            "Limited to 10 Maintenance Requests per property",
            "Mobile Access",
            "Upto 10 PDC Management",
            "Analytics Reports",
            "Up to 10 Prospective Tenant Lists",
            "Limited to 10 Billing Units",
            "10-day Free Trial",
        ],
    },
    {
        id: 3,
        name: "Premium Plan",
        price: 1000,
        trialDays: 14,
        popular: false,
        features: [
            "Unlimited Properties",
            "Unlimited Property Listings",
            "Unlimited Maintenance Requests",
            "Mobile Access",
            "Analytics Reports",
            "Unlimited Prospective Tenant Lists",
            "Unlimited Billing Units",
            "14-day Free Trial",
        ],
    },
];
