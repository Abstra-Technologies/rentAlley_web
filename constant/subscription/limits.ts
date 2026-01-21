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
            maxAssetsPerProperty: 50,      // hard cap
            financialHistoryYears: 1,     // how many years can be viewed

        },
        features: {
            reports: false,
            announcements: true,
            pdcManagement: false,
            aiUnitGenerator: false,
            bulkImport: false,
            assetManagement:false,
            financialInsights: false,
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
            maxAssetsPerProperty: 50,      // hard cap
            financialHistoryYears: 1,     // how many years can be viewed

        },
        features: {
            reports: true,
            pdcManagement: true,
            aiUnitGenerator: false,
            bulkImport: true,
            announcements: true,
            assetManagement:true,
            financialInsights: true,

        },
    },

    "Pro Plan": {
        limits: {
            maxProperties: 20,
            maxUnits: 50,
            maxMaintenanceRequest: 100,
            maxBilling: 50,
            maxProspect: 50,
            maxStorage: 2,
            assetManagement:true,
            maxAssetsPerProperty: 50,
            financialHistoryYears: 1,     // how many years can be viewed

        },
        features: {
            reports: true,
            pdcManagement: true,
            aiUnitGenerator: true,
            bulkImport: true,
            announcements: true,
            assetManagement:true,
            financialInsights: true,

        },
    },

    "Enterprise Plan": {
        limits: {
            maxProperties: 20,
            maxUnits: 50,
            maxMaintenanceRequest: 100,
            maxBilling: 50,
            maxProspect: 50,
            maxStorage: 2,
            maxAssetsPerProperty: 50,      // hard cap
            financialHistoryYears: 1,     // how many years can be viewed

        },
        features: {
            reports: true,
            pdcManagement: true,
            aiUnitGenerator: true,
            bulkImport: true,
            announcements: true,
            assetManagement:true,
            financialInsights: true,

        },
    },

    "Beta_Program": {
    "limits": {
      "maxProperties": 5,
      "maxUnits": null,          // Unlimited units
      "maxMaintenanceRequest": null,
      "maxBilling": null,
      "maxProspect": null,
      "maxStorage": 2,
      "maxAssetsPerProperty": 10,
      "financialHistoryYears": 1
    },
    "features": {
      "reports": true,
      "pdcManagement": true,
      "aiUnitGenerator": true,
      "bulkImport": true,
      "announcements": true,
      "assetManagement": true,
      "financialInsights": true
    }
}
} as const;
