import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-800 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-emerald-600/30"></div>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.3"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>

        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-emerald-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-blue-300/20 to-emerald-300/20 rounded-full blur-lg"></div>
      </div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-6">
                <div className="inline-flex items-center mb-4">
                  <Image
                    src="/upkyp.png"
                    alt="UpKyp Logo"
                    width={130}
                    height={32}
                    priority
                    className="brightness-0 invert"
                  />
                </div>
                <p className="text-blue-100 leading-relaxed text-sm lg:text-base">
                  Finding your perfect rental property has never been easier.
                  Your trusted partner in modern property management.
                </p>
              </div>

              {/* Social Links */}
              <div className="flex space-x-3">
                {[
                  {
                    href: "https://facebook.com",
                    icon: FaFacebookF,
                    color: "from-blue-500 to-blue-600",
                    label: "Facebook",
                  },
                  {
                    href: "https://twitter.com",
                    icon: FaTwitter,
                    color: "from-blue-400 to-blue-500",
                    label: "Twitter",
                  },
                  {
                    href: "https://instagram.com",
                    icon: FaInstagram,
                    color: "from-emerald-500 to-emerald-600",
                    label: "Instagram",
                  },
                  {
                    href: "https://linkedin.com",
                    icon: FaLinkedinIn,
                    color: "from-emerald-400 to-emerald-500",
                    label: "LinkedIn",
                  },
                ].map((social, index) => (
                  <Link
                    key={index}
                    href={social.href}
                    className={`w-10 h-10 bg-gradient-to-r ${social.color} rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl group backdrop-blur-sm border border-white/10`}
                    aria-label={social.label}
                  >
                    <social.icon className="text-white group-hover:scale-110 transition-transform duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-6 relative">
                Contact Us
                <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"></div>
              </h3>
              <address className="not-italic text-blue-100 space-y-3 text-sm lg:text-base">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-white">
                      123 Property Street
                    </p>
                    <p>Manila, Philippines 1000</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5 text-emerald-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p>info@Upkyp.com</p>
                </div>

                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5 text-emerald-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p>+63 123 456 7890</p>
                </div>
              </address>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-6 relative">
                Quick Links
                <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"></div>
              </h3>
              <ul className="text-blue-100 space-y-3 text-sm lg:text-base">
                {[
                  {
                    href: "/pages/public/support",
                    label: "Contact Support",
                    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
                  },
                  {
                    href: "/pages/about-us",
                    label: "About Us",
                    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  },
                  {
                    href: "/pages/find-rent",
                    label: "Find Rent",
                    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  },
                  {
                    href: "/pages/terms-services",
                    label: "Terms & Conditions",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                  },
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="flex items-center space-x-3 hover:text-white hover:translate-x-1 transition-all duration-300 group"
                    >
                      <svg
                        className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d={link.icon}
                        />
                      </svg>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-6 relative">
                Services
                <div className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"></div>
              </h3>
              <ul className="text-blue-100 space-y-3 text-sm lg:text-base">
                {[
                  {
                    label: "Property Management",
                    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                  },
                  {
                    label: "Tenant Screening",
                    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                  },
                  {
                    label: "Digital Payments",
                    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                  },
                  {
                    label: "24/7 Support",
                    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
                  },
                ].map((service, index) => (
                  <li key={index} className="flex items-center space-x-3 group">
                    <svg
                      className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={service.icon}
                      />
                    </svg>
                    <span className="group-hover:text-white transition-colors duration-300">
                      {service.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Section - Uncomment if needed
          <div className="bg-gradient-to-r from-blue-600/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 mb-12 border border-white/20">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div className="text-center lg:text-left">
                <h3 className="text-xl lg:text-2xl font-bold mb-2">Stay Updated</h3>
                <p className="text-blue-100 text-sm lg:text-base">Get the latest property listings and updates delivered to your inbox.</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 flex-1 sm:min-w-[250px]"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          */}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 bg-gradient-to-r from-blue-900/50 to-emerald-900/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-blue-200 text-sm">
                <p className="text-center sm:text-left select-none">
                  Copyright © 2025 Upkyp. All rights reserved.
                </p>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/pages/privacy-policy"
                    className="hover:text-white transition-colors duration-300"
                  >
                    Privacy Policy
                  </Link>
                  <span className="text-blue-300">•</span>
                  <Link
                    href="/pages/terms-services"
                    className="hover:text-white transition-colors duration-300"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>

              {/* Optional: Back to top button */}
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hidden md:flex items-center space-x-2 text-blue-200 hover:text-white transition-colors duration-300 group"
              >
                <span className="text-sm">Back to top</span>
                <svg
                  className="w-4 h-4 group-hover:-translate-y-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
