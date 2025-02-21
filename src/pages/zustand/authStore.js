
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decryptData } from "../crypto/encrypt";

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            admin: null,
            loading: true,

            decryptUserData: (data) => {
                try {
                    const encryptionKey = process.env.ENCRYPTION_SECRET;
                    if (!encryptionKey) {
                        console.error("Missing ENCRYPTION_SECRET in environment variables.");
                        return data;
                    }

                    return {
                        user_id: data.user_id,
                        firstName: decryptData(JSON.parse(data.firstName), encryptionKey),
                        lastName: decryptData(JSON.parse(data.lastName), encryptionKey),
                        email: decryptData(JSON.parse(data.email), encryptionKey),
                        profilePicture: data.profilePicture,
                        birthDate: data.birthDate,
                        phoneNumber: decryptData(JSON.parse(data.phoneNumber), encryptionKey),
                        is_2fa_enabled: data.is_2fa_enabled,
                        tenant_id: data.tenant_id || null,
                        userType: data.userType || null,
                        landlord_id: data.landlord_id || null,
                        is_verified: data.landlord_id ? data.is_verified || false : null,
                        is_trial_used: data.landlord_id ? data.is_trial_used || false : null,
                        subscription: data.subscription
                            ? {
                                subscription_id: data.subscription_id,
                                plan_name: data.subscription.plan_name,
                                status: data.subscription.status,
                                start_date: data.subscription.start_date,
                                end_date: data.subscription.end_date,
                                payment_status: data.subscription.payment_status,
                                trial_end_date: data.trial_end_date,
                            }
                            : null,
                    };
                } catch (error) {
                    console.error("Error decrypting user data:", error);
                    return data;
                }
            },

            decryptAdminData: (data) => {
                try {
                    const encryptionKey = process.env.ENCRYPTION_SECRET;
                    if (!encryptionKey) {
                        console.error("Missing ENCRYPTION_SECRET in environment variables.");
                        return data;
                    }

                    return {
                        admin_id: data.admin_id,
                        username: data.username,
                        first_name: decryptData(JSON.parse(data.first_name), encryptionKey),
                        last_name: decryptData(JSON.parse(data.last_name), encryptionKey),
                        email: decryptData(JSON.parse(data.email), encryptionKey),
                        role: data.role,
                        status: data.status,
                        profile_picture: data.profile_picture
                    };
                } catch (error) {
                    console.error("Error decrypting admin data:", error);
                    return data;
                }
            },

            setUser: (userData) => set((state) => ({
                user: state.decryptUserData(userData),
                admin: null,
                loading: false
            })),

            setAdmin: (adminData) => set((state) => ({
                admin: state.decryptAdminData(adminData),
                user: null,
                loading: false
            })),

            logout: () => set({ user: null, admin: null, loading: false }),

            fetchSession: async () => {
                try {
                    set({ loading: true });
                    const response = await fetch("/api/auth/me", { method: "GET", credentials: "include" });

                    if (!response.ok) {
                        set({ user: null, admin: null, loading: false });
                        return;
                    }

                    const data = await response.json();
                    console.log("API Response data", data);

                    if (data.admin_id) {
                        set((state) => ({ admin: state.decryptAdminData(data), user: null, loading: false }));
                    } else if (data.user_id) {
                        set((state) => ({ user: state.decryptUserData(data), admin: null, loading: false }));
                    } else {
                        set({ user: null, admin: null, loading: false });
                    }
                } catch (error) {
                    console.error("Session fetch failed:", error);
                    set({ user: null, admin: null, loading: false });
                }
            },
        }),

    )
);

export default useAuthStore;
