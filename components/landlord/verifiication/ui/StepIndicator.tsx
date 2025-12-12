// components/landlordVerification/ui/StepIndicator.jsx
import { FiCheck } from "react-icons/fi";

export default function StepIndicator({ steps, currentStep, isStepComplete }) {
    return (
        <div className="flex justify-between items-center mb-6">
            {steps.map((step, i) => {
                const Icon = step.icon;
                const active = currentStep === step.id;
                const done = currentStep > step.id || isStepComplete(step.id);

                return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                        <div
                            className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-2
                ${done ? "bg-emerald-500 text-white" : active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"}
              `}
                        >
                            {done ? <FiCheck className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                        </div>
                        <p className={`${active ? "text-blue-600" : done ? "text-emerald-600" : "text-gray-500"} text-sm`}>
                            {step.title}
                        </p>
                        <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                );
            })}
        </div>
    );
}
