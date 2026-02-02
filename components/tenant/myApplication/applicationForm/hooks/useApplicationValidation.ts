import Swal from "sweetalert2";
import { TenantApplicationFormData } from "../types";

export function validateBasicInfo(data: TenantApplicationFormData) {
    if (!data.firstName || !data.lastName) {
        Swal.fire("Error", "Name required", "error");
        return false;
    }

    const dob = new Date(data.birthDate);
    const age = new Date().getFullYear() - dob.getFullYear();
    if (age < 18) {
        Swal.fire("Age Restriction", "Must be 18+", "warning");
        return false;
    }

    return true;
}
