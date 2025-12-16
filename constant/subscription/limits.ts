// Used for subscription capabilities per tier

export const subscriptionConfig = {
    "Free Plan": {
        limits: {
            maxProperties: 5,
            maxUnits: 2,
            maxMaintenanceRequest: 10,
            maxBilling: 2,
            maxProspect: 3,
            maxStorage: 2,
        },
        features: {
            reports: false,
            postDatedChecks: false,
            aiUnitGenerator: false,
            bulkImport: false,
        },
    },

    "Standard Plan": {
        limits: {
            maxProperties: 10,
            maxUnits: null, // null = unlimited
            maxMaintenanceRequest: 10,
            maxBilling: 10,
            maxProspect: 10,
            maxStorage: 2,

        },
        features: {
            reports: true,
            postDatedChecks: true,
            aiUnitGenerator: false,
            bulkImport: true,
        },
    },

    "Premium Plan": {
        limits: {
            maxProperties: 20,
            maxUnits: 50,
            maxMaintenanceRequest: 100,
            maxBilling: 50,
            maxProspect: 50,
            maxStorage: 2,

        },
        features: {
            reports: true,
            postDatedChecks: true,
            aiUnitGenerator: true,
            bulkImport: true,
        },
    },
} as const;
