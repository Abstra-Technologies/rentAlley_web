"use client";

import { availablePermissions } from "@/constant/adminPermission";

interface EditModalProps {
    formData: {
        username: string;
        email: string;
        role: string;
        status: string;
        password?: string;
        permissions: string[];
    };
    handleChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
    handlePermissionChange: (
        e: React.ChangeEvent<HTMLInputElement>
    ) => void;
    handleUpdate: () => void;
    closeModal: () => void;
}

const EditModal = ({
                       formData,
                       handleChange,
                       handlePermissionChange,
                       handleUpdate,
                       closeModal,
                   }: EditModalProps) => {
    const isSuperAdmin = formData.role === "superadmin";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden">
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Edit Co-Admin Information
                    </h2>
                    <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* BASIC INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                            />
                        </div>
                    </div>

                    {/* ROLE & STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                            >
                                <option value="admin">Admin</option>
                                <option value="superadmin">Super Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                            >
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password (optional)
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password || ""}
                            onChange={handleChange}
                            placeholder="Leave blank to keep current password"
                            className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-blue-300"
                        />
                    </div>

                    {/* PERMISSIONS */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Permissions
                            </label>

                            {isSuperAdmin && (
                                <span className="text-xs text-gray-500 italic">
                                    Super Admin has full access
                                </span>
                            )}
                        </div>

                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg border
                                ${isSuperAdmin
                                ? "bg-gray-100 opacity-60"
                                : "bg-gray-50"}
                            `}
                        >
                            {availablePermissions.map((perm) => (
                                <label
                                    key={perm.id}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <input
                                        type="checkbox"
                                        name="permissions"
                                        value={perm.id}
                                        checked={formData.permissions?.includes(perm.id)}
                                        onChange={handlePermissionChange}
                                        disabled={isSuperAdmin}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    {perm.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
