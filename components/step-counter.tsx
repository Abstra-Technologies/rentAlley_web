import React from "react";
import { Check } from "lucide-react";

const steps = [
  {
    id: 1,
    label: "Property Details",
    shortLabel: "Details",
    description: "Basic info & photos",
  },
  {
    id: 2,
    label: "Verification Documents",
    shortLabel: "Documents",
    description: "Legal docs & verification",
  },
];

interface StepCounterProps {
  currentStep: number;
  totalSteps?: number;
}

const StepCounter = ({ currentStep }: StepCounterProps) => {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="w-full mb-4 sm:mb-6">
      {/* Mobile Progress */}
      <div className="block sm:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-xs font-bold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Step Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
              {currentStep}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {steps[currentStep - 1]?.label}
              </h3>
              <p className="text-xs text-gray-500">
                {steps[currentStep - 1]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Step Counter */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isUpcoming = step.id > currentStep;

                return (
                  <React.Fragment key={step.id}>
                    {/* Step Circle and Label */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="relative">
                        {/* Step Circle */}
                        <div
                          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                            isCompleted
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                              : isCurrent
                                ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg shadow-blue-500/30 scale-110"
                                : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              strokeWidth={3}
                            />
                          ) : (
                            step.id
                          )}
                        </div>

                        {/* Active Step Pulse */}
                        {isCurrent && (
                          <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-xl opacity-30 animate-ping" />
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="mt-3 text-center">
                        <p
                          className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                            isCompleted
                              ? "text-emerald-600"
                              : isCurrent
                                ? "text-blue-600"
                                : "text-gray-400"
                          }`}
                        >
                          {step.shortLabel}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 hidden lg:block">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="flex-1 px-3 sm:px-6 lg:px-8">
                        <div className="relative h-1">
                          {/* Background Line */}
                          <div className="absolute inset-0 bg-gray-200 rounded-full" />
                          {/* Progress Line */}
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${
                              isCompleted
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 w-full"
                                : isCurrent
                                  ? "bg-gradient-to-r from-blue-500 to-emerald-500 w-1/2"
                                  : "w-0"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepCounter;
