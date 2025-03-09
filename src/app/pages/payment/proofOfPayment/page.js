"use client";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const PaymentForm = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment/method");
        const data = await response.json();
        console.log("Fetched Payment Methods:", data);
        if (data.success) {
          setPaymentMethods(data.paymentMethods);
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
        Payment Method:
      </label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        required
        className="w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-200"
      >
        <option value="">Select a method</option>
        {paymentMethods.map((method, index) => (
          <option key={method.method_id || index} value={method.method_id}>
            {method.method_name}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700">
        Amount Paid:
      </label>
      <input
        type="number"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
        required
        className="w-full border border-gray-300 p-2 rounded-lg focus:ring focus:ring-blue-200"
      />

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
