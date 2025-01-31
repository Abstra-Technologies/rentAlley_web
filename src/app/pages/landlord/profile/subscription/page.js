export default function LandlordSubscription() {
  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Select a plan that fits your needs. We offer flexible options for
          everyone.
        </p>
      </div>

      <div className="mt-12 max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 sm:grid-cols-1 sm:grid-rows-3 lg:grid-rows-1 px-4">
        {/* Free Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900">Free Plan</h3>
          <p className="mt-4 text-gray-600">
            Perfect for individuals getting started.
          </p>
          <ul className="mt-6 space-y-4 text-gray-600">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Limited Access
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Community Support
            </li>
          </ul>
          <button className="mt-6 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Start for Free
          </button>
        </div>

        {/* Standard Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900">
            Standard Plan
          </h3>
          <p className="mt-4 text-gray-600">
            Ideal for growing businesses with more needs.
          </p>
          <ul className="mt-6 space-y-4 text-gray-600">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Everything in Free Plan
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Priority Support
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Unlimited Access
            </li>
          </ul>
          <button className="mt-6 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Choose Standard
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900">Premium Plan</h3>
          <p className="mt-4 text-gray-600">
            For enterprises and teams that need advanced features.
          </p>
          <ul className="mt-6 space-y-4 text-gray-600">
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Everything in Standard Plan
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Dedicated Support
            </li>
            <li className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"
                  clipRule="evenodd"
                />
              </svg>
              Custom Features
            </li>
          </ul>
          <button className="mt-6 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Choose Premium
          </button>
        </div>
      </div>
    </div>
  );
}
