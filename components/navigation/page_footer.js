import Link from "next/link";
import {
    FaFacebookF,
    FaTwitter,
    FaInstagram,
    FaLinkedinIn,
} from "react-icons/fa";

const Page_footer = () => {
    return (
        <footer className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white relative overflow-hidden">

            {/* Decorative blurred circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">

                {/* TOP: Logo + description + social */}
                <div className="flex flex-col items-center text-center mb-12">
                    <Link href="/" className="text-4xl font-bold select-none mb-3">
                        Upkyp
                    </Link>

                    <p className="text-white/90 text-sm max-w-md leading-relaxed mb-6">
                        Finding your perfect rental property has never been easier.
                        Your trusted partner in modern property management.
                    </p>

                    <div className="flex space-x-4">
                        {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map(
                            (Icon, index) => (
                                <Link
                                    key={index}
                                    href="#"
                                    aria-label="Social Link"
                                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20 backdrop-blur-sm"
                                >
                                    <Icon className="text-white text-sm" />
                                </Link>
                            )
                        )}
                    </div>
                </div>

                {/* LINK SECTIONS — 2 columns on mobile, 4 on large */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 text-center sm:text-left">

                    {/* Product */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                            Product
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/pages/find-rent" className="text-white/80 hover:text-white text-sm">Find Rent</Link></li>
                            <li><Link href="/pages/partner" className="text-white/80 hover:text-white text-sm">Become a Partner</Link></li>
                            <li><Link href="/pages/public/download" className="text-white/80 hover:text-white text-sm">Download App</Link></li>
                            <li><Link href="/pages/about-us" className="text-white/80 hover:text-white text-sm">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                            Company
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/pages/about-us" className="text-white/80 hover:text-white text-sm">About</Link></li>
                            <li><Link href="/pages/contact-us" className="text-white/80 hover:text-white text-sm">Contact</Link></li>
                            <li><Link href="/pages/public/support" className="text-white/80 hover:text-white text-sm">Support</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                            Legal
                        </h3>
                        <ul className="space-y-2">
                            <li><Link href="/pages/public/privacy" className="text-white/80 hover:text-white text-sm">Privacy Policy</Link></li>
                            <li><Link href="/pages/public/terms-services" className="text-white/80 hover:text-white text-sm">Terms of Service</Link></li>
                            <li><Link href="/pages/public/eula" className="text-white/80 hover:text-white text-sm">EULA</Link></li>
                            <li><Link href="/pages/public/refund" className="text-white/80 hover:text-white text-sm">Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact — Full width on mobile */}
                    <div className="col-span-2 sm:col-span-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
                            Contact
                        </h3>

                        <div className="text-white/80 text-sm space-y-2 leading-relaxed">
                            <p>Manila, Philippines</p>
                            <p>abstra.technologies@gmail.com</p>
                            <p>+63 921 321 88888</p>
                        </div>
                    </div>
                </div>

                {/* Footer bottom area */}
                <div className="border-t border-white/20 mt-12 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">

                        <p className="text-white/80 text-sm">
                            © 2025 UpKyp. All rights reserved.
                        </p>

                        <div className="flex items-center space-x-6">
                            <Link href="/pages/privacy-policy" className="text-white/80 hover:text-white text-sm">
                                Privacy Policy
                            </Link>
                            <span className="text-white/40">·</span>
                            <Link href="/pages/public/terms-services" className="text-white/80 hover:text-white text-sm">
                                Terms of Service
                            </Link>
                        </div>

                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Page_footer;
