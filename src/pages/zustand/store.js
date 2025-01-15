import { create } from "zustand";

const useRoleStore = create((set) => ({
    role: null,
    setRole: (role) => set({ role }),
}));

export default useRoleStore;
