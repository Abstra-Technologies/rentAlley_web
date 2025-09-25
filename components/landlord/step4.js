import usePropertyStore from "../../zustand/property/usePropertyStore";
import { PAYMENT_FREQUENCIES } from "../../constant/paymentFrequency";
import { PAYMENT_METHODS } from "../../constant/paymentMethods";

export function StepFour() {
  const { property, setProperty } = usePropertyStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
  };

  const handleCheckboxChange = (method) => {
    const accepted = property.paymentMethodsAccepted || [];
    const newList = accepted.includes(method)
      ? accepted.filter((m) => m !== method)
      : [...accepted, method];

    setProperty({ ...property, paymentMethodsAccepted: newList });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Property Payment Methods
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          Configure payment options and fees to streamline your rental process.
        </p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Payment Configuration */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  1
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Payment Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Late Fee */}
              <div className="space-y-2">
                <label
                  htmlFor="lateFee"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Late Fee (%)
                </label>
                <div className="relative">
                  <input
                    id="lateFee"
                    name="lateFee"
                    type="number"
                    placeholder="5"
                    min={0}
                    max={100}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-8 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                    value={property.lateFee || ""}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Percentage of monthly rent charged for late payments
                </p>
              </div>

              {/* Association Dues */}
              <div className="space-y-2">
                <label
                  htmlFor="assocDues"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Association Dues
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                    ₱
                  </span>
                  <input
                    id="assocDues"
                    name="assocDues"
                    type="number"
                    placeholder="0"
                    min={0}
                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                    value={property.assocDues || ""}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Monthly homeowners association fees
                </p>
              </div>

              {/* Payment Frequency */}
              <div className="lg:col-span-2 space-y-2">
                <label
                  htmlFor="paymentFrequency"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Payment Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={property.paymentFrequency || ""}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                >
                  <option value="" disabled>
                    Select Payment Frequency
                  </option>
                  {PAYMENT_FREQUENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  How often tenants will pay rent
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  2
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Accepted Payment Methods
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = (
                    property.paymentMethodsAccepted || []
                  ).includes(method.key);
                  return (
                    <label
                      key={method.key}
                      className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-300 shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(method.key)}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <span
                        className={`text-sm sm:text-base font-medium ${
                          isSelected ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {method.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Selected Count */}
              {(property.paymentMethodsAccepted || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">
                      {(property.paymentMethodsAccepted || []).length} payment
                      method(s) selected
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FlexiPay Feature */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  3
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Additional Features
              </h3>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <label className="flex items-start gap-3 sm:gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={property.flexiPayEnabled || false}
                  onChange={(e) =>
                    setProperty({
                      ...property,
                      flexiPayEnabled: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800 text-sm sm:text-base">
                      Allow FlexiPay Payment
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Premium Feature
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    FlexiPay allows tenants to make partial payments until the
                    due date, improving payment flexibility and reducing late
                    payments.
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-3 h-3 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Reduces late fees</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg
                        className="w-3 h-3 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Better tenant satisfaction</span>
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Summary Card */}
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Payment Configuration Summary
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Late Fee:</span>
                  <span className="font-medium">
                    {property.lateFee || 0}% of monthly rent
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Association Dues:</span>
                  <span className="font-medium">
                    ₱{property.assocDues || 0}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Frequency:</span>
                  <span className="font-medium">
                    {property.paymentFrequency
                      ? PAYMENT_FREQUENCIES.find(
                          (f) => f.value === property.paymentFrequency
                        )?.label || property.paymentFrequency
                      : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Methods:</span>
                  <span className="font-medium">
                    {(property.paymentMethodsAccepted || []).length} selected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FlexiPay:</span>
                  <span
                    className={`font-medium ${
                      property.flexiPayEnabled
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {property.flexiPayEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
