'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, Calendar, ChevronDown } from 'lucide-react'

interface AdvancedFilterProps {
    baseUrl: string
    unidades: string[]
}

export default function AdvancedFilter({ baseUrl, unidades }: AdvancedFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [unidad, setUnidad] = useState(searchParams.get('curso') || 'all')
    const [fecha, setFecha] = useState(searchParams.get('fecha') || '')
    const [limit, setLimit] = useState(searchParams.get('limit') || '10')

    const updateFilters = (newParams: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(newParams).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })

        // Always reset to page 1 on filter change
        if (!newParams.page) {
            params.set('page', '1')
        }

        router.push(`${baseUrl}?${params.toString()}`)
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('q') || '')) {
                updateFilters({ q: search })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    return (
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Búsqueda por Nombre */}
                <div className="md:col-span-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar alumno/a..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl text-sm font-medium transition-all"
                    />
                </div>

                {/* Filtro por Curso */}
                <div className="md:col-span-3 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                        value={unidad}
                        onChange={(e) => {
                            setUnidad(e.target.value)
                            updateFilters({ curso: e.target.value })
                        }}
                        className="block w-full pl-11 pr-10 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl text-sm font-medium appearance-none transition-all"
                    >
                        <option value="all">Todos los cursos</option>
                        {unidades.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                {/* Filtro por Fecha */}
                <div className="md:col-span-3 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => {
                            setFecha(e.target.value)
                            updateFilters({ fecha: e.target.value })
                        }}
                        className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl text-sm font-medium transition-all"
                    />
                </div>

                {/* Cantidad por Página */}
                <div className="md:col-span-2 relative">
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(e.target.value)
                            updateFilters({ limit: e.target.value })
                        }}
                        className="block w-full px-4 py-2.5 bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl text-sm font-medium appearance-none transition-all text-center"
                    >
                        <option value="10">10 por pág.</option>
                        <option value="25">25 por pág.</option>
                        <option value="50">50 por pág.</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
