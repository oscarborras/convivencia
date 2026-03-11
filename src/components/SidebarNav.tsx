'use client'

import { LayoutDashboard, FileText, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SidebarNav() {
    const pathname = usePathname()

    const navItems = [
        {
            href: '/dashboard',
            label: 'Inicio',
            icon: LayoutDashboard,
            active: pathname === '/dashboard'
        },
        {
            href: '/partes/crear',
            label: 'Nuevo Parte',
            icon: FileText,
            active: pathname === '/partes/crear'
        },
        {
            href: '/retrasos/crear',
            label: 'Registrar Retraso',
            icon: Clock,
            active: pathname === '/retrasos/crear'
        }
    ]

    return (
        <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all font-medium border ${item.active
                            ? 'text-blue-700 bg-blue-50 border-blue-100 shadow-sm'
                            : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : ''}`} />
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
