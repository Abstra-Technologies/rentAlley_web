import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white shadow-md rounded-b-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              Rentahan
            </Link>
          </div>

          {/* Links */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-gray-300">
              Home
            </Link>
            <Link href="#" className="hover:text-gray-300">
              About Us
            </Link>
            <Link href="#" className="hover:text-gray-300">
              Contact
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex space-x-4">
            <Link
              href="/pages/auth/login"
              className="px-4 py-2 bg-gray-100 text-blue-600 rounded-md font-medium hover:bg-gray-200"
            >
              Login
            </Link>
            <Link
              href="/pages/auth"
              className="px-4 py-2 bg-blue-500 rounded-md font-medium hover:bg-blue-700"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
