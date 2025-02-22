'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (otp.length !== 6 || isNaN(otp)) {
      toast.error("OTP must be a 6-digit number");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/verify-otp', { otp }, { withCredentials: true });
      toast.success(response.data.message);
      const userType = response.data.userType;
      setTimeout(() => {
        if (userType === "tenant") {
          router.push('/pages/tenant/dashboard');
        } else if (userType === "landlord") {
          router.push('/pages/landlord/dashboard');
        } else {// Default redirect
        }
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    }
    setLoading(false);
  };

  // Function to resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post('/api/auth/resend-otp');  // Ensure this API is implemented
      toast.info("New OTP sent. Check your email.");
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <ToastContainer />
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email</h2>
          <p className="text-gray-600 text-sm text-center mb-4">
            Enter the 6-digit OTP sent to your email.
          </p>
          <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full p-2 border rounded-md mb-2 text-center"
              maxLength="6"
              required
          />
          <button
              onClick={handleVerify}
              className="w-full p-2 bg-blue-600 text-white rounded-md"
              disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Didn't receive the OTP?</p>
            <button
                onClick={handleResendOTP}
                className="text-blue-500 text-sm"
                disabled={loading}
            >
              {loading ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
  );
}
