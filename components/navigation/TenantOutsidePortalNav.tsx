import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MdOutlineRssFeed, MdClose } from "react-icons/md";
import { HiMenuAlt3 } from "react-icons/hi";
import Link from 'next/link';
import {
    HomeIcon,
    ClockIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { FaFile } from 'react-icons/fa';
import { RiCommunityFill } from "react-icons/ri";

export default function TenantOutsidePortalNav() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        // Cleanup
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const handleClick_MyApplications = () => {
        router.push('/pages/tenant/myApplications');
    };

    const handleMyUnitsClick = () => {
        router.push('/pages/tenant/my-unit');
    };

    const handleFeedClick = () => {
        router.push('/pages/tenant/feeds');
    };

    const isActive = (path: string) => {
        return pathname === path;
    };

    const navigationItems = [
        {
            name: 'Feeds',
            icon: MdOutlineRssFeed,
            onClick: handleFeedClick,
            path: '/pages/tenant/feeds',
            badge: null
        },
        {
            name: 'My Units',
            icon: RiCommunityFill,
            onClick: handleMyUnitsClick,
            path: '/pages/tenant/my-unit',
            badge: null
        },
        {
            name: 'My Applications',
            icon: FaFile,
            onClick: handleClick_MyApplications,
            path: '/pages/tenant/myApplications',
            badge: null
        },
        {
            name: 'Unit History',
            icon: ClockIcon,
            onClick: () => router.push('#'),
            path: '#',
            badge: null
        }
    ];

    const SidebarContent = () => (
        <>
            {/* Header */}
            <div className="mb-8 px-4">
                <div className="flex items-center justify-between mb-4 md:justify-start">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900">My Rental</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage your rental property</p>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <MdClose className="h-6 w-6 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-4">
                <ul className="space-y-1">
                    {navigationItems.map((item, index) => {
                        const IconComponent = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                            <li key={index}>
                                <button
                                    onClick={item.onClick}
                                    className={`
                                        flex w-full items-center justify-between rounded-xl p-3 text-left transition-all duration-200
                                        ${active 
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                        }
                                        group relative
                                    `}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`
                                            p-2 rounded-lg transition-colors
                                            ${active 
                                                ? 'bg-indigo-500' 
                                                : 'bg-gray-100 group-hover:bg-indigo-100'
                                            }
                                        `}>
                                            <IconComponent className={`
                                                h-4 w-4 transition-colors
                                                ${active ? 'text-white' : 'text-gray-600 group-hover:text-indigo-600'}
                                            `} />
                                        </div>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    
                                    {item.badge && (
                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                    
                                    {active && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="mt-auto px-4 pt-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm font-medium mb-1">Need Help?</div>
                    <div className="text-xs opacity-90 mb-3">Contact our support team</div>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                        Get Support
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-20 left-4 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-3 rounded-xl bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <HiMenuAlt3 className="h-6 w-6 text-gray-700" />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-72 border-r border-gray-200 bg-white py-6 flex-col min-h-screen">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <div className={`
                md:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                shadow-2xl
            `}>
                <div className="py-6 flex-1 flex flex-col">
                    <SidebarContent />
                </div>
            </div>
        </>
    );
}