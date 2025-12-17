// constants/subscriptionPlans.ts

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    trialDays: number;
    popular: boolean;
    features: string[];
    transactionFeeRate: number;
    discountedFeeRate: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 1,
        name: "Free Plan",
        price: 0,
        trialDays: 0,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate:4.0,
        features: [
            "1 Property",
            "Limited to 20 units",
            "Property and Unit Management",
            "Maintenance Management",
            "Announcement and Messaging",
            "Billing Management",
            "Payment Ledger Logs",
            "Transaction Fee: 4.8% (Inclusive of Gateway fees + Upkyp fees) in every payouts."
        ],
    },
    {
        id: 2,
        name: "Standard Plan",
        price: 1499,
        trialDays: 60,
        popular: true,
        transactionFeeRate: 4.8,
        discountedFeeRate:4.5,
        features: [
            "60-day Free Trial",
            "Up to 5 Properties",
            "Limited to 10 Maintenance Requests per property",
            "Mobile Access",
            "Upto 10 PDC Management",
            "Analytics Reports",
            "Up to 10 Prospective Tenant Lists",
            "Limited to 10 Billing Units",
            "Transaction Fee: 4.8% (Inclusive of Gateway fees + Upkyp fees"

        ],
    },
    {
        id: 3,
        name: "Pro Plan",
        price: 2499,
        trialDays: 60,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate:4.5,
        features: [
            "60-day Free Trial",

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
        price: 0,
        trialDays: 60,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate:4.5,
        features: [
            "60-day Free Trial",

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
