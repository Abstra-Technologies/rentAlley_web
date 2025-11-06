"use client";
import useEditPropertyStore from "../../../../zustand/property/useEditPropertyStore";
import { PAYMENT_FREQUENCIES } from "../../../../constant/paymentFrequency";
import { PAYMENT_METHODS } from "../../../../constant/paymentMethods";

export function StepFourEdit() {
    // @ts-ignore
    const { property, setProperty } = useEditPropertyStore();

    // @ts-ignore
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProperty({ ...property, [name]: value });
    };

    const handleCheckboxChange = (method: string) => {
        const accepted = property.paymentMethodsAccepted || [];
        const newList = accepted.includes(method)
            ? accepted.filter((m: string) => m !== method)
            : [...accepted, method];

        setProperty({ ...property, paymentMethodsAccepted: newList });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6 rounded-xl">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Edit Property Payment Methods
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                    Choose which payment methods are accepted for this property.
                </p>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
                <label className="block text-base font-semibold text-gray-800 mb-4">
                    Payment Methods Accepted
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                        <label
                            key={method.key}
                            className="flex items-center justify-between border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={(property.paymentMethodsAccepted || []).includes(method.key)}
                                    onChange={() => handleCheckboxChange(method.key)}
                                    className="h-5 w-5 accent-blue-600 rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm sm:text-base text-gray-700 font-medium">
                {method.label}
              </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* FlexiPay (Optional) */}
            {/* Uncomment if needed */}
            {/* <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 mt-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={property.flexiPayEnabled || false}
          onChange={(e) =>
            setProperty({ ...property, flexiPayEnabled: e.target.checked })
          }
          className="mt-1 h-5 w-5 accent-emerald-600 rounded-md focus:ring-2 focus:ring-emerald-500"
        />
        <span>
          <span className="block font-semibold text-gray-800">
            Allow FlexiPay Payment?
          </span>
          <p className="text-sm text-gray-600 leading-snug">
            FlexiPay allows tenants to make partial payments until the due date.
          </p>
        </span>
      </label>
    </div> */}
        </div>
    );

}
