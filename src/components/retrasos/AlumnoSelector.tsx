'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, User } from 'lucide-react'

interface Alumno {
    id: string
    alumno: string
    unidad: string
    tutor1_nombre?: string
    tutor1_primer_apellido?: string
    tutor1_segundo_apellido?: string
    tutor1_email?: string
    tutor2_nombre?: string
    tutor2_primer_apellido?: string
    tutor2_segundo_apellido?: string
    tutor2_email?: string
}

interface AlumnoSelectorProps {
    alumnos: Alumno[]
}

export default function AlumnoSelector({ alumnos }: AlumnoSelectorProps) {
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (searchInputRef.current) {
            if (!selectedId) {
                searchInputRef.current.setCustomValidity('⚠️ Por favor, busca y haz clic en un alumno de la lista.')
            } else {
                searchInputRef.current.setCustomValidity('')
            }
        }
    }, [selectedId])

    const handleSelect = (id: string, name: string) => {
        setSelectedId(id)
        setSearch(name)
    }

    const filteredAlumnos = useMemo(() => {
        if (!search.trim()) return []

        // Si ya hay un alumno seleccionado y el texto coincide exactamente,
        // no mostramos la lista de resultados para dejar el formulario limpio.
        const exactMatch = alumnos.find(a => a.id === selectedId && a.alumno === search)
        if (exactMatch) return []

        // Función para eliminar acentos y convertir a minúsculas
        const normalize = (text: string) =>
            text.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()

        const normalizedSearch = normalize(search)
        const searchTerms = normalizedSearch.split(' ').filter(t => t.length > 0)

        return alumnos.filter(a => {
            const normalizedName = normalize(a.alumno)
            return searchTerms.every(term => normalizedName.includes(term))
        }).slice(0, 8)
    }, [search, alumnos, selectedId])

    const selectedAlumno = useMemo(() => {
        return alumnos.find(a => a.id === selectedId) || null
    }, [selectedId, alumnos])

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                    <div className="bg-blue-50 p-2 rounded-xl">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="uppercase text-xs tracking-widest text-gray-400">Alumno/a</span>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            if (selectedId) setSelectedId(null)
                        }}
                        placeholder="Escribe el nombre del alumno/a"
                        className="block w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm text-sm"
                    />
                </div>

                {selectedAlumno && (
                    <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Curso */}
                            <div className="col-span-1 md:col-span-2">
                                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Curso</span>
                                <p className="text-sm font-semibold text-gray-800">{selectedAlumno.unidad}</p>
                            </div>

                            {/* Tutor 1 */}
                            {(selectedAlumno.tutor1_nombre || selectedAlumno.tutor1_primer_apellido || selectedAlumno.tutor1_segundo_apellido) && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Tutor/a 1</span>
                                    <p className="text-sm font-medium text-gray-800">
                                        {[selectedAlumno.tutor1_nombre, selectedAlumno.tutor1_primer_apellido, selectedAlumno.tutor1_segundo_apellido].filter(Boolean).join(' ')}
                                    </p>
                                    {selectedAlumno.tutor1_email && (
                                        <p className="text-xs text-blue-600 mt-0.5"><a href={`mailto:${selectedAlumno.tutor1_email}`} className="hover:underline">{selectedAlumno.tutor1_email}</a></p>
                                    )}
                                </div>
                            )}

                            {/* Tutor 2 */}
                            {(selectedAlumno.tutor2_nombre || selectedAlumno.tutor2_primer_apellido || selectedAlumno.tutor2_segundo_apellido) && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Tutor/a 2</span>
                                    <p className="text-sm font-medium text-gray-800">
                                        {[selectedAlumno.tutor2_nombre, selectedAlumno.tutor2_primer_apellido, selectedAlumno.tutor2_segundo_apellido].filter(Boolean).join(' ')}
                                    </p>
                                    {selectedAlumno.tutor2_email && (
                                        <p className="text-xs text-blue-600 mt-0.5"><a href={`mailto:${selectedAlumno.tutor2_email}`} className="hover:underline">{selectedAlumno.tutor2_email}</a></p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {search.trim() !== '' && filteredAlumnos.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Resultados ({filteredAlumnos.length})
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                        {filteredAlumnos.map((a) => (
                            <label
                                key={a.id}
                                className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedId === a.id
                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="alumno_selection"
                                    value={a.id}
                                    checked={selectedId === a.id}
                                    onChange={() => handleSelect(a.id, a.alumno)}
                                    required
                                    className="peer sr-only"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedId === a.id
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-gray-300'
                                    }`}>
                                    {selectedId === a.id && (
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className={`font-bold truncate text-sm ${selectedId === a.id ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                        {a.alumno}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-500">
                                        {a.unidad}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            {/* Campo oculto para asegurar que el ID del alumno se envíe en el formulario */}
            <input type="hidden" name="alumno_id" value={selectedId || ''} />
        </div>
    )
}
