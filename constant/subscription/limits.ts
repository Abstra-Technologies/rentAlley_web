
export const listingLimits = {
    "Free Plan": {
        maxProperties: 5,
        maxUnits: 2,
        maxMaintenanceRequest: 10,
        maxReports: 3,
        maxBilling: 2,
        maxProspect: 3,
        maxPDC: 0,
    },
    "Standard Plan": {
        maxProperties: 5,
        maxUnits: 10,
        maxMaintenanceRequest: 10,
        maxReports: Infinity,
        maxBilling: 10,
        maxProspect: 10,
        maxPDC: 20,
    },
    "Premium Plan": {
        maxProperties: 20,
        maxUnits: 50,
        maxMaintenanceRequest: 100,
        maxReports: Infinity,
        maxBilling: Infinity,
        maxProspect: Infinity,
        maxPDC: 100,
    },
};
