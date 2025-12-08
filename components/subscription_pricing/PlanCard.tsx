"use client";

export default function PlanCard({
                                     plan,
                                     isCurrent,
                                     isSelected,
                                     trialAvailable,
                                     onSelect,
                                 }) {
    return (
        <div
            onClick={() => !isCurrent && onSelect(plan)}
            className={`
        relative bg-white rounded-2xl overflow-hidden transition duration-300
        ${isCurrent ? "opacity-60 cursor-not-allowed ring-2 ring-gray-300" : "cursor-pointer hover:shadow-xl hover:-translate-y-1"}
        ${isSelected ? "ring-2 ring-blue-500 shadow-lg" : "shadow-md"}
      `}
        >
            {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg text-sm">
                    Popular
                </div>
            )}

            {/* Header */}
            <div className="p-8 border-b">
                <h3 className="text-xl font-bold">{plan.name}</h3>

                <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold">₱{plan.price}</span>
                    <span className="ml-1 text-xl font-semibold">/month</span>
                </div>

                {plan.trialDays > 0 && trialAvailable && (
                    <p className="mt-4 text-blue-600 font-medium text-sm">
                        {plan.trialDays}-day free trial
                    </p>
                )}
            </div>

            {/* Features */}
            <div className="px-8 pt-6 pb-8">
                <h4 className="text-xs uppercase text-gray-500 font-semibold">
                    What's included
                </h4>

                <ul className="mt-4 space-y-3">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 10-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                                />
                            </svg>
                            <p className="ml-3 text-gray-700 text-sm">{f}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="px-6 py-4 bg-gray-50">
                {isCurrent ? (
                    <span className="w-full block text-center py-2 rounded-md bg-white border text-gray-700">
            Current Plan
          </span>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(plan);
                        }}
                        className={`
              w-full py-2 rounded-md text-sm font-medium shadow-sm
              ${isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}
            `}
                    >
                        {isSelected ? "Selected" : "Select"}
                    </button>
                )}
            </div>
        </div>
    );
}
