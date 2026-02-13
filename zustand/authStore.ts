// zustand/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    user_id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profilePicture: string | null;
    phoneNumber: string | null;
    occupation: string | null;
    citizenship: string | null;
    address: string | null;
    birthDate: string | null;
    points: number;
    userType: string | null;
    landlord_id: string | null;
    tenant_id: string | null;
    is_verified?: boolean | null;
    is_trial_used?: boolean | null;
    subscription?: {
        subscription_id: string | null;
        plan_name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
        payment_status: string;
        trial_end_date: string | null;
    } | null;
    [key: string]: any;
}

interface Admin {
    admin_id: string | null;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;
    status: string;
    profile_picture: string | null;
    permissions: any;
}

interface AuthState {
    user: User | null;
    admin: Admin | null;
    loading: boolean;

    setUser: (userData: User) => void;
    setAdmin: (adminData: Admin) => void;
    updateUser: (updates: Partial<User>) => void;
    logout: () => void;

    fetchSession: () => Promise<void>;
    signOut: () => Promise<void>;
    signOutAdmin: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            admin: null,
            loading: true,

            setUser: (userData) =>
                set({
                    user: userData,
                    admin: null,
                    loading: false,
                }),

            setAdmin: (adminData) =>
                set({
                    admin: adminData,
                    user: null,
                    loading: false,
                }),

            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),

            logout: () => {
                set({ user: null, admin: null, loading: false });
            },

            fetchSession: async () => {
                try {
                    set({ loading: true });

                    const response = await fetch("/api/auth/me", {
                        method: "GET",
                        credentials: "include",
                    });

                    if (!response.ok) {
                        set({ user: null, admin: null, loading: false });
                        return;
                    }

                    const data = await response.json();

                    if (data.admin_id) {
                        set({ admin: data, user: null, loading: false });
                    } else if (data.user_id) {
                        set({ user: data, admin: null, loading: false });
                    } else {
                        set({ user: null, admin: null, loading: false });
                    }
                } catch (error) {
                    console.error("[AuthStore] fetchSession error:", error);
                    set({ user: null, admin: null, loading: false });
                }
            },

            /* ============================
               USER LOGOUT (NO BACK BUTTON)
            ============================ */
            signOut: async () => {
                try {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                } catch (err) {
                    console.warn("[AuthStore] Logout request failed", err);
                } finally {
                    // 🔥 Clear zustand + persisted storage
                    set({ user: null, admin: null, loading: false });
                    localStorage.removeItem("auth-storage");

                    // 🔥 Replace history (no back navigation)
                    window.location.replace("/pages/auth/login");
                }
            },

            /* ============================
               ADMIN LOGOUT (NO BACK BUTTON)
            // ============================ */
            signOutAdmin: async () => {
                try {
                    await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                } catch (err) {
                    console.warn("[AuthStore] Admin logout request failed", err);
                } finally {
                    set({ admin: null, user: null, loading: false });
                    localStorage.removeItem("auth-storage");

                    window.location.replace("/pages/admin_login");
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user
                    ? {
                        user_id: state.user.user_id,
                        landlord_id: state.user.landlord_id,
                        tenant_id: state.user.tenant_id,
                        userType: state.user.userType,
                        points: state.user.points,
                        is_verified: state.user.is_verified,
                        is_trial_used: state.user.is_trial_used,
                    }
                    : null,
                admin: state.admin ? { admin_id: state.admin.admin_id } : null,
            }),
        }
    )
);

export default useAuthStore;
