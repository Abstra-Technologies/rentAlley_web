import React from "react";

const steps = [
  { id: 1, label: "Property Details", shortLabel: "Details" },
  { id: 2, label: "Property Documents", shortLabel: "documents" },
];

const StepCounter = ({ currentStep }) => {
  return (
    <div className="w-full mb-6 sm:mb-8">
      {/* Mobile Progress Bar */}
      <div className="block sm:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="mt-2 text-center">
          <h3 className="text-base font-semibold text-gray-900">
            {steps[currentStep - 1]?.label}
          </h3>
        </div>
      </div>

      {/* Desktop Step Counter */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {/* Step Circle and Label */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative">
                      <div
                        className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${
                          step.id < currentStep
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110"
                            : step.id === currentStep
                            ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg scale-110"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>

                      {/* Active Step Pulse Animation */}
                      {step.id === currentStep && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full opacity-30 animate-ping"></div>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      <p
                        className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                          step.id === currentStep
                            ? "text-blue-600"
                            : step.id < currentStep
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.shortLabel}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 hidden lg:block">
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 px-2 sm:px-4">
                      <div className="relative">
                        <div className="h-0.5 sm:h-1 bg-gray-200 rounded-full"></div>
                        <div
                          className={`absolute top-0 left-0 h-0.5 sm:h-1 rounded-full transition-all duration-500 ease-out ${
                            step.id < currentStep
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 w-full"
                              : "w-0"
                          }`}
                        ></div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepCounter;
