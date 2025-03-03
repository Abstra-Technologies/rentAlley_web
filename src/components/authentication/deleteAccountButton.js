import { useState } from "react";
import { useRouter} from "next/navigation";
import useAuth from "../../../hooks/useSession";
import useAuthStore from "../../zustand/authStore";

export default function DeleteAccountButton() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter(); // ✅ Initialize Next.js router
    const {user} = useAuthStore();
    const user_id = user?.user_id;
    const userType = user?.userType;

    const handleDeleteAccount = async () => {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/deleteAccount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id, userType }), // ✅ Ensure it's correctly formatted
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                 new Error(data.error || "Failed to request account deletion.");
            }

            setMessage("Your account will be deleted in 30 days unless you cancel.");

            setTimeout(() => {
                router.push("/pages/auth/login");
                window.location.reload();

            }, 1000);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
            setShowModal(false);
        }
    };


    return (
        <div className="flex flex-col items-center">
            {/* Delete Account Button */}
            <button
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                onClick={() => setShowModal(true)}
            >
                Delete Account
            </button>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-semibold text-gray-800">Confirm Account Deletion</h2>
                        <p className="text-gray-600 mt-2">
                            Are you sure you want to delete your account? This action will start a 30-day grace period.
                        </p>

                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Message */}
            {message && (
                <p className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded-md">{message}</p>
            )}
        </div>
    );
}
