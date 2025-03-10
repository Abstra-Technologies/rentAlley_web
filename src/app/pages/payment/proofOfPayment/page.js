"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const PaymentForm = () => {
  const searchParams = useSearchParams();
  const agreement_id = searchParams.get("agreement_id");
  const queryAmount = searchParams.get("amountPaid");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState(queryAmount);
  const [file, setFile] = useState(null);
  const [paymentType, setPaymentType] = useState("");

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
      }
    };
    fetchPaymentMethods();
  }, []);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("paymentMethod", paymentMethod);
    formData.append("amountPaid", amountPaid);
    formData.append("agreement_id", agreement_id);
    formData.append("paymentType", paymentType);

    if (file) {
      formData.append("proof", file);
    }

    const response = await fetch("/api/payment/upload-proof", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      alert("Payment proof uploaded successfully!");
    } else {
      alert(`Error: ${data.error || "Failed to upload proof"}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
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

      <div className="flex justify-between items-center border border-gray-300 p-2 rounded-lg">
        <label className="text-sm font-medium text-gray-700">
          Amount Paid:
        </label>
        <span className="text-gray-900 font-semibold">
          {amountPaid || "0.00"}
        </span>
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
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
      >
        Submit Payment
      </button>
    </form>
  );
};

export default PaymentForm;
