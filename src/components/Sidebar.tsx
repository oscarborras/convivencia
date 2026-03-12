'use client'

import { Shield, LayoutDashboard, FileText, Menu, LogOut, Clock, X, Upload, GraduationCap, Settings, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
    userEmail?: string | null
}

export default function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Close sidebar when route changes
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const navItems = [
        {
            href: '/dashboard',
            label: 'Inicio',
            icon: LayoutDashboard,
            active: pathname === '/dashboard'
        },
        {
            href: '/retrasos',
            label: 'Dashboard Retrasos',
            icon: Clock,
            active: pathname === '/retrasos'
        },
        {
            href: '/retrasos/historial',
            label: 'Historial Retrasos',
            icon: History,
            active: pathname === '/retrasos/historial'
        },
        {
            href: '/partes',
            label: 'Dashboard Partes',
            icon: FileText,
            active: pathname === '/partes'
        },
        {
            href: '/importar',
            label: 'Importar',
            icon: Upload,
            active: pathname === '/importar'
        },
        {
            href: '/ajustes',
            label: 'Ajustes',
            icon: Settings,
            active: pathname === '/ajustes'
        }
    ]



    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-30 fixed top-0 w-full print:hidden">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-brand/10 p-2 rounded-[14px] flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary-brand stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black font-display text-slate-900 text-lg tracking-tight leading-none mb-0.5 mt-0.5">
                            Convivencia
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                            Gestión Escolar
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Desktop & Mobile */}
            <aside className={`
                fixed inset-y-0 left-0 bg-white border-r border-gray-200 shadow-xl z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col print:hidden
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center gap-4">
                    <div className="bg-primary-brand/10 p-3 rounded-[18px] flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-primary-brand stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black font-display text-slate-900 text-2xl tracking-tight leading-none mb-1 mt-1">
                            Convivencia
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none">
                            Gestión Escolar
                        </span>
                    </div>
                </div>

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

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 mb-2 truncate">
                        {userEmail}
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-2xl transition-colors font-medium border border-transparent hover:border-red-100">
                            <LogOut className="w-5 h-5 mt-0.5" />
                            Cerrar sesión
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
