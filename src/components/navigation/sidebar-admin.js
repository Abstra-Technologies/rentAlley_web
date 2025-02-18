'use client'
import Link from "next/link"
import { Home, ScrollText, Users2, Users, Building2, Bug } from 'lucide-react'

export default function SideNavAdmin({ admin }) {
  const sideNavItems = [
    { href: '/pages/system_admin/activiyLog', icon: ScrollText, label: 'Activity Log' },
    { href: '/pages/system_admin/co_admin/list', icon: Users2, label: 'Add Co-admin' },
    { href: '/pages/system_admin/tenant_landlord/tenant_mgt', icon: Users, label: 'Tenant Management' },
    { href: '/pages/system_admin/tenant_landlord/landlord_mgt', icon: Users, label: 'Landlord Management' },
    { href: '/pages/system_admin/propertyManagement/list', icon: Building2, label: 'Property Verification' },
    { href: '/pages/system_admin/annoucement', icon: ScrollText, label: 'Announcements' },
    { href: '/pages/system_admin/bug_report/list', icon: Bug, label: 'Bug Reports' },
    { href: '/pages/system_admin/auditLogs', icon: ScrollText, label: 'Audit Logs' },
  ]

  return (

    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <Home className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-semibold text-blue-600">Rentahan Admin Portal</span>
        </div>
        {/*<div className="mt-4 px-2">*/}
        {/*  <p className="text-sm text-gray-600">Welcome, {admin.username}</p>*/}
        {/*  <p className="text-xs text-gray-500">Role: {admin.role}</p>*/}
        {/*</div>*/}
      </div>
      <nav className="mt-4">
        {sideNavItems.map((item, index) => (
          <Link 
            key={index}
            href={item.href}
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
