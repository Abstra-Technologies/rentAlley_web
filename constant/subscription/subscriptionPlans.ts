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
            "Limited to 20 units",
            "Property and Unit Management",
            "Maintenance Management",
            "Announcement and Messaging",
            "Billing Management",
            "Payment Ledger Logs",
            "3% Commisson Transaction Fee ( Inclusive of Payment Gateway + Platform Fees)"
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
        name: "Pro Plan",
        price: 1000,
        trialDays: 14,
        popular: false,
        features: [
            "Unlimited Properties",
            "Unlimited Maintenance Requests",
            "Mobile Access",
            "Analytics Reports",
            "Unlimited Prospective Tenant Lists",
            "Unlimited Billing Units",
            "14-day Free Trial",
        ],
    },
    {
        id: 4,
        name: "Enterprise Plan",
        price: 1000,
        trialDays: 14,
        popular: false,
        features: [
            "Unlimited Properties",
            "Unlimited Maintenance Requests",
            "Mobile Access",
            "Analytics Reports",
            "Unlimited Prospective Tenant Lists",
            "Unlimited Billing Units",
            "14-day Free Trial",
        ],
    },
];
