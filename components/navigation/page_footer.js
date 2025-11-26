import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import Image from "next/image";

const Page_footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-4 text-5xl select-none">
                Upkyp
              </Link>
              <p className="text-white/90 text-sm leading-relaxed mb-6 max-w-sm">
                Finding your perfect rental property has never been easier. Your
                trusted partner in modern property management.
              </p>

              <div className="flex space-x-3">
                {[
                  {
                    href: "https://facebook.com",
                    icon: FaFacebookF,
                    label: "Facebook",
                  },
                  {
                    href: "https://twitter.com",
                    icon: FaTwitter,
                    label: "Twitter",
                  },
                  {
                    href: "https://instagram.com",
                    icon: FaInstagram,
                    label: "Instagram",
                  },
                  {
                    href: "https://linkedin.com",
                    icon: FaLinkedinIn,
                    label: "LinkedIn",
                  },
                ].map((social, index) => (
                  <Link
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm border border-white/20"
                    aria-label={social.label}
                  >
                    <social.icon className="text-white text-sm" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/pages/find-rent", label: "Find Rent" },
                  { href: "/pages/partner", label: "Become a Partner" },
                  { href: "/pages/public/download", label: "Download App" },
                  { href: "/pages/about-us", label: "About Us" },
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/pages/about-us", label: "About" },
                  { href: "/pages/contact-us", label: "Contact" },
                  { href: "/pages/public/support", label: "Support" },
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/pages/public/privacy", label: "Privacy Policy" },
                  { href: "/pages/public/terms-services", label: "Terms of Service" },
                  { href: "/pages/public/eula", label: "EULA" },
                  { href: "/pages/public/refund", label: "Refund Policy" },

                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contact
              </h3>
              <address className="not-italic text-white/80 space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0"
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
                  <span>Manila, Philippines</span>
                </div>

                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-white/60 flex-shrink-0"
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
                  <span>abstra.technologies@gmail.com</span>
                </div>

                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-white/60 flex-shrink-0"
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
                  <span>+63 921 321 88888 </span>
                </div>
              </address>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-white/80 text-sm text-center md:text-left">
                © 2025 UpKyp. All rights reserved.
              </p>

              <div className="flex items-center space-x-6">
                <Link
                  href="/pages/privacy-policy"
                  className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <span className="text-white/40">·</span>
                <Link
                  href="/pages/public/terms-services"
                  className="text-white/80 hover:text-white text-sm transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Page_footer;
