'use client'

import { Shield, LayoutDashboard, FileText, Menu, LogOut, Clock, X, Upload, GraduationCap, Settings, History, BarChart3 } from 'lucide-react'
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

    const navigation = [
        {
            title: null,
            items: [
                {
                    href: '/dashboard',
                    label: 'Inicio',
                    icon: LayoutDashboard,
                    active: pathname === '/dashboard'
                }
            ]
        },
        {
            title: 'Gestión de Retrasos',
            items: [
                {
                    href: '/retrasos',
                    label: 'Dashboard',
                    icon: FileText,
                    active: pathname === '/retrasos'
                },
                {
                    href: '/retrasos/control',
                    label: 'Control',
                    icon: BarChart3,
                    active: pathname === '/retrasos/control'
                },
                {
                    href: '/retrasos/historial',
                    label: 'Historial',
                    icon: History,
                    active: pathname === '/retrasos/historial'
                }
            ]
        },
        {
            title: 'Gestión de Partes',
            items: [
                {
                    href: '/partes',
                    label: 'Dashboard',
                    icon: FileText,
                    active: pathname === '/partes'
                },
                {
                    href: '/partes/control',
                    label: 'Control',
                    icon: BarChart3,
                    active: pathname === '/partes/control'
                },
                {
                    href: '/partes/historial',
                    label: 'Historial',
                    icon: History,
                    active: pathname === '/partes/historial'
                }
            ]
        },
        {
            title: 'Administración',
            items: [
                {
                    href: '/importar',
                    label: 'Importar Datos',
                    icon: Upload,
                    active: pathname === '/importar'
                },
                {
                    href: '/ajustes',
                    label: 'Configuración',
                    icon: Settings,
                    active: pathname === '/ajustes'
                }
            ]
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
                fixed inset-y-0 left-0 bg-white border-r border-gray-200 shadow-xl z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col print:hidden h-screen
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

                <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto pb-6">
                    {navigation.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-2">
                            {group.title && (
                                <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all font-bold text-sm border ${item.active
                                            ? 'text-blue-700 bg-blue-50 border-blue-100 shadow-sm'
                                            : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-400 opacity-70 group-hover:opacity-100'}`} />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-400 mb-2 truncate bg-white rounded-xl border border-gray-100 shadow-sm">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        {userEmail}
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-black text-xs border border-transparent hover:border-red-100 uppercase tracking-widest active:scale-95">
                            <LogOut className="w-4 h-4 mt-0.5" />
                            Cerrar sesión
                        </button>
                    </form>
                    <span className="block text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">v.0.14.0</span>
                </div>
            </aside>
        </>
    )
}

function User(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
