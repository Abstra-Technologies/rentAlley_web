"use client";

import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
} from "react-icons/fi";

interface Props {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    canProceed: () => boolean;
    handleSubmit: () => void;
}

export default function FooterActions({
                                          currentStep,
                                          setCurrentStep,
                                          canProceed,
                                          handleSubmit,
                                      }: Props) {
    return (
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
                {currentStep > 1 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </button>
                ) : (
                    <div />
                )}

                {currentStep < 5 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!canProceed()}
                        className="inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                        Continue
                        <FiArrowRight className="w-4 h-4 ml-2" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <FiCheckCircle className="w-4 h-4 mr-2" />
                        Submit Verification
                    </button>
                )}
            </div>
        </div>
    );
}
