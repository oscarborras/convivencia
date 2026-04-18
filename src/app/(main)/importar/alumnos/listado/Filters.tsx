'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useRef, useCallback, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props { unidades: string[] }

export default function AlumnosFilters({ unidades }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')
    const [localUnidad, setLocalUnidad] = useState(searchParams.get('unidad') || '')

    useEffect(() => {
        setLocalSearch(searchParams.get('search') || '')
        setLocalUnidad(searchParams.get('unidad') || '')
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

    const handleUnidad = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLocalUnidad(e.target.value)
        pushParam({ unidad: e.target.value })
    }

    const handleClear = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setLocalSearch('')
        setLocalUnidad('')
        const params = new URLSearchParams()
        const perPage = searchParams.get('per_page')
        if (perPage) params.set('per_page', perPage)
        router.push(`${pathname}?${params.toString()}`)
    }

    const hasFilters = localSearch || localUnidad

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
            <div className="min-w-40">
                <select
                    value={localUnidad}
                    onChange={handleUnidad}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-brand/30 focus:border-primary-brand bg-white"
                >
                    <option value="">Todas las unidades</option>
                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
            {hasFilters && (
                <button onClick={handleClear}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-4 h-4" /> Limpiar
                </button>
            )}
        </div>
    )
}
