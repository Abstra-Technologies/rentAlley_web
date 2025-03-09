import { useState } from "react";
import { useRouter} from "next/navigation";
import useAuthStore from "../../zustand/authStore";

import Swal from "sweetalert2";

export default function DeleteAccountButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuthStore();
    const user_id = user?.user_id;
    const userType = user?.userType;

    const handleDeleteAccount = async () => {
        setLoading(true);

        try {
            const response = await fetch("/api/auth/deleteAccount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id, userType }),
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                 new Error(data.error || "Failed to request account deletion.");
            }

            await Swal.fire({
                title: "Account Deletion Requested",
                text: "Your account will be deleted in 30 days unless you cancel.",
                icon: "success",
                confirmButtonText: "OK",
            });

            setTimeout(() => {
                router.push("/pages/auth/login");
                window.location.reload();
            }, 1000);

        } catch (error) {
            await Swal.fire({
                title: "Error",
                text: error.message,
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action will start a 30-day grace period before permanent deletion.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete my account",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteAccount();
            }
        });
    };

    return (
        <div className="flex flex-col items-center">
            <button
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                onClick={confirmDelete}
                disabled={loading}
            >
                {loading ? "Processing..." : "Delete Account"}
            </button>
        </div>
    );
}
