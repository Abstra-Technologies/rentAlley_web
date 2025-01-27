"use client";
import React, { useState } from "react";
import StepCounter from "../../../../../../../components/step-counter";
import LandlordLayout from "../../../../layouts/landlordLayouts";
import { StepOne, StepTwo, StepThree, StepFour } from "../../../../../../../components/step-counter"; // Import individual step components

export default function PropertyListingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4)); // Prevent going past step 4
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1)); // Prevent going below step 1
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepOne formData={formData} handleChange={handleChange} />;
      case 2:
        return <StepTwo formData={formData} handleChange={handleChange} />;
      case 3:
        return <StepThree formData={formData} handleChange={handleChange} />;
      case 4:
        return <StepFour formData={formData} />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Step Counter */}
        <StepCounter currentStep={step} />

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          {renderStep()}
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => alert("Form Submitted!")}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
