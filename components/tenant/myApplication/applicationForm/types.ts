export interface TenantApplicationFormData {
    unit_id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    phoneNumber: string;
    email: string;
    address: string;
    occupation: string;
    employment_type: string;
    monthly_income: string;
}

export type ApplicationStep = 0 | 1 | 2;
