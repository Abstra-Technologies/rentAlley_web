// "use client";
// import { useState, useEffect } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Swal from "sweetalert2";
//
// export default function Verify2FA() {
//     const searchParams = useSearchParams();
//     const user_id = searchParams.get("user_id");
//     const router = useRouter();
//
//     const [otp, setOtp] = useState("");
//     const [message, setMessage] = useState("");
//     const [resendMessage, setResendMessage] = useState("");
//     const [isResending, setIsResending] = useState(false);
//
//     // Set the pending flag if user_id exists and it's not already set.
//     useEffect(() => {
//         if (user_id && !localStorage.getItem("pending_2fa")) {
//             localStorage.setItem("pending_2fa", "true");
//             console.log("pending_2fa flag set in localStorage.");
//         }
//     }, [user_id]);
//
//     // Check for the pending flag and setup onpopstate handler.
//     useEffect(() => {
//         if (!localStorage.getItem("pending_2fa")) {
//             console.log("pending_2fa flag missing, redirecting to login.");
//             router.push("/pages/auth/login");
//         }
//
//         // Prevent forward navigation
//         window.history.pushState(null, null, window.location.href);
//         window.onpopstate = () => {
//             localStorage.removeItem("pending_2fa");
//             router.push("/pages/auth/login");
//         };
//     }, [router]);
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//
//         try {
//             const res = await fetch("/api/auth/verify-2fa-otp", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ user_id, otp }),
//                 credentials: "include",
//             });
//
//             const data = await res.json();
//
//             if (res.ok) {
//                 await Swal.fire("Success", "OTP verified successfully!", "success");
//                 localStorage.removeItem("pending_2fa"); // Remove flag after successful login
//
//                 // Redirect based on user type
//                 if (data.user.userType === "tenant") {
//                     router.push("/pages/tenant/dashboard");
//                 } else if (data.user.userType === "landlord") {
//                     router.push("/pages/landlord/dashboard");
//                 } else {
//                     setMessage("Invalid user type.");
//                 }
//             } else {
//                 setMessage(data.error || "Invalid OTP.");
//             }
//         } catch (error) {
//             console.error("Error:", error);
//             setMessage("Something went wrong.");
//         }
//     };
//
//     const handleResendOTP = async () => {
//         setIsResending(true);
//         setResendMessage("");
//         try {
//             const res = await fetch("/api/auth/resend-2fa-otp", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ user_id }),
//                 credentials: "include",
//             });
//
//             const data = await res.json();
//
//             if (res.ok) {
//                 await Swal.fire("Success", "OTP resend successful!", "success");
//             } else {
//                 setResendMessage(data.error);
//             }
//         } catch (error) {
//             console.error("Error resending OTP:", error);
//             setResendMessage("Something went wrong while resending OTP.");
//         } finally {
//             setIsResending(false);
//         }
//     };
//
//     return (
//         <div className="flex items-center justify-center min-h-screen bg-gray-100">
//             <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
//                 <h1 className="text-2xl font-bold text-center mb-6">Enter 2FA OTP</h1>
//                 <form className="space-y-4" onSubmit={handleSubmit}>
//                     <input
//                         type="text"
//                         placeholder="Enter OTP"
//                         className="w-full border p-2 rounded"
//                         value={otp}
//                         onChange={(e) => setOtp(e.target.value)}
//                         required
//                     />
//                     <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">
//                         Verify OTP
//                     </button>
//                 </form>
//                 {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
//                 <button
//                     type="button"
//                     onClick={handleResendOTP}
//                     className="w-full py-2 bg-gray-600 text-white rounded mt-4"
//                     disabled={isResending}
//                 >
//                     {isResending ? "Resending..." : "Resend OTP"}
//                 </button>
//                 {resendMessage && <p className="mt-2 text-center text-sm text-green-500">{resendMessage}</p>}
//             </div>
//         </div>
//     );
// }

"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

// ✅ Create a separate component for `useSearchParams()`
const SearchParamsWrapper = ({ setUserId }) => {
  const searchParams = useSearchParams();
  const user_id = searchParams.get("user_id");

  useEffect(() => {
    setUserId(user_id);
  }, [user_id, setUserId]);

  return null;
};

export default function Verify2FA() {
  const router = useRouter();
  const [user_id, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Set the pending flag if user_id exists and it's not already set.
  useEffect(() => {
    if (user_id && !localStorage.getItem("pending_2fa")) {
      localStorage.setItem("pending_2fa", "true");
      console.log("pending_2fa flag set in localStorage.");
    }
  }, [user_id]);

  // Check for the pending flag and setup onpopstate handler.
  useEffect(() => {
    if (!localStorage.getItem("pending_2fa")) {
      console.log("pending_2fa flag missing, redirecting to login.");
      router.push("/pages/auth/login");
    }

    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => {
      localStorage.removeItem("pending_2fa");
      router.push("/pages/auth/login");
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/verify-2fa-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, otp }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire("Success", "OTP verified successfully!", "success");
        localStorage.removeItem("pending_2fa"); // Remove flag after successful login

        // Redirect based on user type
        if (data.user.userType === "tenant") {
          router.push("/pages/tenant/dashboard");
        } else if (data.user.userType === "landlord") {
          router.push("/pages/landlord/dashboard");
        } else {
          setMessage("Invalid user type.");
        }
      } else {
        setMessage(data.error || "Invalid OTP.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong.");
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-2fa-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire("Success", "OTP resend successful!", "success");
      } else {
        setResendMessage(data.error);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setResendMessage("Something went wrong while resending OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper setUserId={setUserId} />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter the OTP sent to your registered email or phone.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP Code
              </label>
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
              Verify OTP
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-red-500">{message}</p>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn’t receive the OTP?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              className={`w-full py-2 text-white font-medium rounded-md transition ${
                isResending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
          </div>

          {resendMessage && (
            <p className="mt-2 text-center text-sm text-green-500">
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </Suspense>
  );

  // return (
  //     <Suspense fallback={<div>Loading...</div>}>
  //         <SearchParamsWrapper setUserId={setUserId} />
  //         <div className="flex items-center justify-center min-h-screen bg-gray-100">
  //             <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
  //                 <h1 className="text-2xl font-bold text-center mb-6">Enter 2FA OTP</h1>
  //                 <form className="space-y-4" onSubmit={handleSubmit}>
  //                     <input
  //                         type="text"
  //                         placeholder="Enter OTP"
  //                         className="w-full border p-2 rounded"
  //                         value={otp}
  //                         onChange={(e) => setOtp(e.target.value)}
  //                         required
  //                     />
  //                     <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">
  //                         Verify OTP
  //                     </button>
  //                 </form>
  //                 {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
  //                 <button
  //                     type="button"
  //                     onClick={handleResendOTP}
  //                     className="w-full py-2 bg-gray-600 text-white rounded mt-4"
  //                     disabled={isResending}
  //                 >
  //                     {isResending ? "Resending..." : "Resend OTP"}
  //                 </button>
  //                 {resendMessage && <p className="mt-2 text-center text-sm text-green-500">{resendMessage}</p>}
  //             </div>
  //         </div>
  //     </Suspense>
  // );
}
