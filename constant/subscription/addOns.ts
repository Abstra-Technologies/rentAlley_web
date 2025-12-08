export interface AddOnItem {
    id: number;
    name: string;
    description: string;
    price: number;
}

export const ADD_ON_SERVICES: AddOnItem[] = [
    {
        id: 1,
        name: "Automated SMS Notifications",
        description: "Send SMS rent reminders and important notifications automatically.",
        price: 149,
    },
    {
        id: 2,
        name: "AI Lease Analyzer",
        description: "Advanced AI-based tenant scoring for risk assessment.",
        price: 199,
    },
    {
        id: 3,
        name: "Advanced Financial Reports",
        description: "Unlock exportable monthly, quarterly, and annual property reports.",
        price: 249,
    },
    {
        id: 4,
        name: "Tenant Support Hotline",
        description: "24/7 support line for your tenants handled by professionals.",
        price: 299,
    },
];
