"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

const PaymentForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id") || "";
  const queryAmount = searchParams.get("amountPaid") || "";
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState(queryAmount || "");
  const [file, setFile] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (queryAmount) {
      setAmountPaid(queryAmount);
    }
  }, [queryAmount]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment/method");
        const data = await response.json();
        console.log("Fetched Payment Methods:", data);
        if (data.success) {
          const filteredMethods = data.paymentMethods.filter(
            (method) => method.method_name.toLowerCase() !== "maya"
          );
          setPaymentMethods(filteredMethods);
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        setError("Failed to load payment methods");
      }
    };
    fetchPaymentMethods();
  }, []);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxSize: 10485760, // 10MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
  
    if (!agreement_id) {
      setError("Missing agreement ID. Please go back and try again.");
      setIsSubmitting(false);
      return;
    }

    if (!amountPaid || amountPaid === "null" || amountPaid === "") {
      setError("Please enter a valid payment amount");
      setIsSubmitting(false);
      return;
    }

    // Validate payment type
    if (!["billing", "security_deposit", "advance_rent"].includes(paymentType)) {
      setError("Invalid payment type");
      setIsSubmitting(false);
      return;
    }

    // Validate proof file for certain payment methods
    if (["2", "3", "4"].includes(paymentMethod) && !file) {
      setError("Proof of payment is required for this method");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("agreement_id", agreement_id);
    formData.append("paymentMethod", paymentMethod);
    formData.append("amountPaid", amountPaid);
    formData.append("paymentType", paymentType);

    if (file) {
      formData.append("proof", file);
    }

    try {
      const response = await fetch("/api/payment/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage("Payment proof uploaded successfully!");
        // Redirect after success
        setTimeout(() => {
          router.push("/pages/tenant/my-unit");
        }, 2000);
      } else {
        setError(`Error: ${data.error || "Failed to upload proof"}`);
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Error submitting payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700">
        Payment Type:
      </label>
      <select
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value)}
        required
        className="w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-200"
      >
        <option value="" disabled>
          Select payment type
        </option>
        <option value="billing">Billing</option>
        <option value="security_deposit">Security Deposit</option>
        <option value="advance_rent">Advance Rent</option>
      </select>

      <label className="block text-sm font-medium text-gray-700">
        Payment Method:
      </label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        required
        className="w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-200"
      >
        <option value="" disabled>
          Select a method
        </option>
        {paymentMethods.map((method, index) => (
          <option key={method.method_id || index} value={method.method_id}>
            {method.method_name}
          </option>
        ))}
      </select>

        <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Amount Paid:
        </label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
          placeholder="Enter amount"
          className="w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-200"
        />
      </div>

      {["2", "3", "4"].includes(paymentMethod) && (
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded-lg hover:bg-gray-100"
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="text-gray-600">{file.name}</p>
          ) : (
            <p className="text-gray-500">
              Drag & drop proof of payment or click to upload
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full ${
          isSubmitting ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
        } text-white py-2 rounded-lg transition`}
      >
        {isSubmitting ? "Submitting..." : "Submit Payment"}
      </button>
    </form>
  );
};

export default PaymentForm;