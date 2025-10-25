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
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Property Payment Rules
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Configure payment policies, deposits, and accepted payment methods for your property.
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

            {/* Rent Increase Policy */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Rent Increase Policy
                </h3>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 sm:p-6">
                <label
                    htmlFor="rentIncreasePercent"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Annual Rent Increase (%)
                </label>
                <div className="relative max-w-md">
                  <input
                      id="rentIncreasePercent"
                      name="rentIncreasePercent"
                      type="number"
                      placeholder="5"
                      min={0}
                      max={100}
                      className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                      value={property.rentIncreasePercent || ""}
                      onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Applied annually on lease renewal.
                </p>
              </div>
            </div>

            {/* Deposit & Advance Rules */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Deposit & Advance Requirements
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Set the required number of months for deposits and advance payments.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label
                        htmlFor="securityDepositMonths"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Security Deposit (Months)
                    </label>
                    <input
                        id="securityDepositMonths"
                        name="securityDepositMonths"
                        type="number"
                        placeholder="2"
                        min={0}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
                        value={property.securityDepositMonths || ""}
                        onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label
                        htmlFor="advancePaymentMonths"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Advance Payment (Months)
                    </label>
                    <input
                        id="advancePaymentMonths"
                        name="advancePaymentMonths"
                        type="number"
                        placeholder="1"
                        min={0}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
                        value={property.advancePaymentMonths || ""}
                        onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Accepted Payment Methods
                </h3>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = (property.paymentMethodsAccepted || []).includes(method.key);
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
                              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
              </div>
            </div>

            {/* FlexiPay Feature */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">4</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Additional Features</h3>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 sm:p-6">
                <label className="flex items-start gap-3 sm:gap-4 cursor-pointer">
                  <input
                      type="checkbox"
                      checked={property.flexiPayEnabled || false}
                      onChange={(e) =>
                          setProperty({ ...property, flexiPayEnabled: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                  <span className="font-semibold text-gray-800 text-sm sm:text-base">
                    Allow FlexiPay Payment
                  </span>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Enable partial payments until due date.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
