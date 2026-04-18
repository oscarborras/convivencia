'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useRef, useCallback, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props { puestos: string[] }

export default function ProfesoresFilters({ puestos }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')
    const [localSinEmail, setLocalSinEmail] = useState(searchParams.get('sin_email') === '1')
    const [localSoloActivos, setLocalSoloActivos] = useState(searchParams.get('solo_activos') === '1')
    const [localPuesto, setLocalPuesto] = useState(searchParams.get('puesto') || '')

    useEffect(() => {
        setLocalSearch(searchParams.get('search') || '')
        setLocalSinEmail(searchParams.get('sin_email') === '1')
        setLocalSoloActivos(searchParams.get('solo_activos') === '1')
        setLocalPuesto(searchParams.get('puesto') || '')
    }, [searchParams])

    const pushParam = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())
        for (const [k, v] of Object.entries(updates)) {
            if (v) params.set(k, v)
            else params.delete(k)
        }
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }, [router, pathname, searchParams])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setLocalSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => pushParam({ search: value }), 300)
    }

    const handleSinEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSinEmail(e.target.checked)
        pushParam({ sin_email: e.target.checked ? '1' : '' })
    }

    const handleSoloActivos = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSoloActivos(e.target.checked)
        pushParam({ solo_activos: e.target.checked ? '1' : '' })
    }

    const handlePuesto = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocalPuesto(e.target.value)
        pushParam({ puesto: e.target.value })
    }

    const handleClear = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setLocalSearch('')
        setLocalSinEmail(false)
        setLocalSoloActivos(false)
        setLocalPuesto('')
        const params = new URLSearchParams()
        const perPage = searchParams.get('per_page')
        if (perPage) params.set('per_page', perPage)
        router.push(`${pathname}?${params.toString()}`)
    }

    const hasFilters = localSearch || localSinEmail || localSoloActivos || localPuesto

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={localSearch}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-brand/30 focus:border-primary-brand"
                />
            </div>
            <div className="min-w-48">
                <select
                    value={localPuesto}
                    onChange={handlePuesto}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-brand/30 focus:border-primary-brand bg-white"
                >
                    <option value="">Todos los puestos</option>
                    {puestos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={localSinEmail}
                    onChange={handleSinEmail}
                    className="w-4 h-4 accent-primary-brand"
                />
                <span className="text-sm font-medium text-slate-600">Sin email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={localSoloActivos}
                    onChange={handleSoloActivos}
                    className="w-4 h-4 accent-primary-brand"
                />
                <span className="text-sm font-medium text-slate-600">Solo activos</span>
            </label>
            {hasFilters && (
                <button onClick={handleClear}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" /> Limpiar
                </button>
            )}
        </div>
    )
}
