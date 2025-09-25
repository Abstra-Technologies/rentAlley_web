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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-2">Property Payment Rules</h2>

          {/* Late Fee */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Late Payment Policy</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Specify the percentage penalty applied to overdue rental payments.
              </p>

              <input
                  id="lateFee"
                  name="lateFee"
                  type="number"
                  placeholder="5"
                  min={0}
                  className="block w-full rounded-md border p-3 focus:ring-blue-500 focus:border-blue-500"
                  value={property.lateFee || ""}
                  onChange={handleChange}
              />
          </div>

          {/* Association Dues */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Association Dues</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Enter the monthly association dues (if applicable). Leave as 0 if none.
              </p>

              <input
                  id="assocDues"
                  name="assocDues"
                  type="number"
                  placeholder="0"
                  min={0}
                  className="block w-full rounded-md border p-3 focus:ring-blue-500 focus:border-blue-500"
                  value={property.assocDues || ""}
                  onChange={handleChange}
              />
          </div>

          {/* Payment Frequency */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Payment Frequency</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Set how often tenants are required to pay rent and other recurring charges.
              </p>

              <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={property.paymentFrequency || ""}
                  onChange={handleChange}
                  className="block w-full rounded-md border p-3 focus:ring-blue-500 focus:border-blue-500"
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
          </div>


        {/* Percentage Increase Per Year */}
          {/* Rent Increase Policy */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Rent Increase Policy</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Specify the annual percentage increase that will be applied to the base
                  rent upon lease renewal or anniversary.
              </p>

              <div>
                  <label
                      htmlFor="rentIncreasePercent"
                      className="block text-sm font-medium text-gray-700"
                  >
                      Annual Rent Increase (%)
                  </label>
                  <input
                      id="rentIncreasePercent"
                      name="rentIncreasePercent"
                      type="number"
                      placeholder="5"
                      min={0}
                      className="mt-1 block w-full rounded-md border p-3"
                      value={property.rentIncreasePercent || ""}
                      onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                      This percentage will be applied annually on the base rent.
                  </p>
              </div>
          </div>

        {/* Advance Payment */}
          {/* Security Deposit & Advance Payment */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Deposit & Advance Rules</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Set the required number of months for security deposit and advance payment that tenants must comply with before moving in.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Security Deposit */}
                  <div>
                      <label
                          htmlFor="securityDepositMonths"
                          className="block text-sm font-medium text-gray-700"
                      >
                          Security Deposit (Months)
                      </label>
                      <input
                          id="securityDepositMonths"
                          name="securityDepositMonths"
                          type="number"
                          placeholder="2"
                          min={0}
                          className="mt-1 block w-full rounded-md border p-3"
                          value={property.securityDepositMonths || ""}
                          onChange={handleChange}
                      />
                  </div>

                  {/* Advance Payment */}
                  <div>
                      <label
                          htmlFor="advancePaymentMonths"
                          className="block text-sm font-medium text-gray-700"
                      >
                          Advance Payment (Months)
                      </label>
                      <input
                          id="advancePaymentMonths"
                          name="advancePaymentMonths"
                          type="number"
                          placeholder="1"
                          min={0}
                          className="mt-1 block w-full rounded-md border p-3"
                          value={property.advancePaymentMonths || ""}
                          onChange={handleChange}
                      />
                  </div>
              </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Choose which payment methods you accept from tenants.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                      <label
                          key={method.key}
                          className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                          <input
                              type="checkbox"
                              checked={(property.paymentMethodsAccepted || []).includes(method.key)}
                              onChange={() => handleCheckboxChange(method.key)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{method.label}</span>
                      </label>
                  ))}
              </div>
          </div>

          {/* FlexiPay */}
          <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800">FlexiPay Option</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Enable FlexiPay if you want to allow tenants to make partial payments until
                  the due date.
              </p>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                      type="checkbox"
                      checked={property.flexiPayEnabled || false}
                      onChange={(e) =>
                          setProperty({ ...property, flexiPayEnabled: e.target.checked })
                      }
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Allow FlexiPay</span>
              </label>
          </div>


      </div>
  );
}
