'use client'

import { useState, useMemo } from 'react'
import { BellOff, Bell, Search, User, Phone, Mail, ShieldAlert, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Interfaces
interface Alumno {
    id: string
    nombre: string
    primer_apellido: string
    segundo_apellido: string
    tutor1_nombre: string
    tutor1_primer_apellido: string
    tutor1_segundo_apellido: string
    tutor1_email: string
    tutor1_telefono: string
    tutor2_nombre: string
    tutor2_primer_apellido: string
    tutor2_segundo_apellido: string
    tutor2_email: string
    tutor2_telefono: string
}

interface NotificacionBloqueada {
    id: string
    alumno_id: string
    tutor_indice: number
    tutor_nombre: string
    email: string
    telefono: string
}

export default function ClientNotificaciones({ 
    alumnos, 
    notificaciones: initialNotificaciones 
}: { 
    alumnos: Alumno[]
    notificaciones: NotificacionBloqueada[] 
}) {
    const supabase = createClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
    const [notificaciones, setNotificaciones] = useState<NotificacionBloqueada[]>(initialNotificaciones)
    const [loading, setLoading] = useState<string | null>(null)

    const normalizeString = (str: string) => {
        if (!str) return ''
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    const filteredAlumnos = useMemo(() => {
        if (!searchQuery.trim()) return []
        const searchTerms = normalizeString(searchQuery).split(' ').filter(Boolean)
        
        return alumnos.filter(alumno => {
            const fullName = normalizeString(`${alumno.nombre} ${alumno.primer_apellido || ''} ${alumno.segundo_apellido || ''}`)
            return searchTerms.every(term => fullName.includes(term))
        }).slice(0, 10) // Limit to 10 for performance in dropdown
    }, [searchQuery, alumnos])

    // Toggle Handler
    const handleToggleNotificacion = async (alumno: Alumno, tutorIndice: number) => {
        const loadingId = `${alumno.id}-${tutorIndice}`
        setLoading(loadingId)
        
        const existingBloqueo = notificaciones.find(n => n.alumno_id === alumno.id && n.tutor_indice === tutorIndice)
        
        try {
            if (existingBloqueo) {
                // Delete
                const { error } = await supabase
                    .from('convi_notificaciones')
                    .delete()
                    .eq('id', existingBloqueo.id)
                    
                if (!error) {
                    setNotificaciones(prev => prev.filter(n => n.id !== existingBloqueo.id))
                }
            } else {
                // Insert
                const tutorParams = tutorIndice === 1 ? {
                    nombre: `${alumno.tutor1_nombre || ''} ${alumno.tutor1_primer_apellido || ''} ${alumno.tutor1_segundo_apellido || ''}`.trim(),
                    email: alumno.tutor1_email || '',
                    telefono: alumno.tutor1_telefono || ''
                } : {
                    nombre: `${alumno.tutor2_nombre || ''} ${alumno.tutor2_primer_apellido || ''} ${alumno.tutor2_segundo_apellido || ''}`.trim(),
                    email: alumno.tutor2_email || '',
                    telefono: alumno.tutor2_telefono || ''
                }
                
                const { data, error } = await supabase
                    .from('convi_notificaciones')
                    .insert({
                        alumno_id: alumno.id,
                        tutor_indice: tutorIndice,
                        tutor_nombre: tutorParams.nombre,
                        email: tutorParams.email,
                        telefono: tutorParams.telefono
                    })
                    .select()
                    .single()
                    
                if (data && !error) {
                    setNotificaciones(prev => [...prev, data])
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(null)
        }
    }

    const getTutorInfo = (alumno: Alumno, indice: number) => {
        if (indice === 1) {
            return {
                nombre: `${alumno.tutor1_nombre || ''} ${alumno.tutor1_primer_apellido || ''} ${alumno.tutor1_segundo_apellido || ''}`.trim(),
                email: alumno.tutor1_email,
                telefono: alumno.tutor1_telefono
            }
        } else {
            return {
                nombre: `${alumno.tutor2_nombre || ''} ${alumno.tutor2_primer_apellido || ''} ${alumno.tutor2_segundo_apellido || ''}`.trim(),
                email: alumno.tutor2_email,
                telefono: alumno.tutor2_telefono
            }
        }
    }

    const renderTutorCard = (indice: number) => {
        if (!selectedAlumno) return null
        
        const info = getTutorInfo(selectedAlumno, indice)
        
        if (!info.nombre && !info.email && !info.telefono) {
            return (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-70 min-h-[250px]">
                    <User className="w-10 h-10 text-slate-300 mb-3" />
                    <span className="text-slate-400 font-bold text-sm">Tutor {indice} no registrado</span>
                </div>
            )
        }

        const isBlocked = notificaciones.some(n => n.alumno_id === selectedAlumno.id && n.tutor_indice === indice)
        const isLoading = loading === `${selectedAlumno.id}-${indice}`

        return (
            <div className={`p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${isBlocked ? 'bg-rose-50/30 border-rose-200 shadow-sm' : 'bg-white border-blue-100 shadow-md'}`}>
                {/* Status Indicator */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider ${isBlocked ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isBlocked ? 'Notificaciones Bloqueadas' : 'Notificaciones Activas'}
                </div>
                
                <div className="flex items-start gap-4 mt-4">
                    <div className={`p-3 rounded-2xl ${isBlocked ? 'bg-rose-100' : 'bg-blue-50'}`}>
                        {isBlocked ? <BellOff className="w-6 h-6 text-rose-600" /> : <Bell className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Tutor {indice}</h3>
                        <p className="text-sm font-bold text-slate-500 mt-0.5">{info.nombre || 'Nombre no especificado'}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{info.email || <span className="text-slate-400 italic">Sin correo</span>}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{info.telefono || <span className="text-slate-400 italic">Sin teléfono</span>}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={() => handleToggleNotificacion(selectedAlumno, indice)}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                            isBlocked 
                            ? 'bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50' 
                            : 'bg-rose-500 text-white shadow-md hover:bg-rose-600 hover:shadow-lg'
                        }`}
                    >
                        {isLoading ? (
                            'Procesando...'
                        ) : isBlocked ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Restaurar Notificaciones
                            </>
                        ) : (
                            <>
                                <BellOff className="w-5 h-5" />
                                Bloquear Notificaciones
                            </>
                        )}
                    </button>
                    {!isBlocked && (
                        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium px-4">
                            Al bloquear, el tutor no recibirá más avisos al registrar retrasos o partes.
                        </p>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-500">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exclusiones</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Notificaciones a Tutores
                    </h1>
                    <p className="text-slate-500 font-medium text-sm max-w-2xl">
                        Busca un alumno para evitar enviar avisos a sus tutores (correo o sms) cuando se le asigne un retraso o parte. 
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 p-8 space-y-8">
                
                {/* Search Section */}
                <div className="relative z-20">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 mb-2 block">
                        Buscar Alumno
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-blue-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Introduce nombre o apellidos..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value); 
                                if (!e.target.value) setSelectedAlumno(null);
                            }}
                            className="block w-full pl-11 pr-10 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900 shadow-sm placeholder-slate-400"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => {setSearchQuery(''); setSelectedAlumno(null);}}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {searchQuery.trim() && filteredAlumnos.length > 0 && !selectedAlumno && (
                        <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-50 max-h-64 overflow-y-auto">
                            {filteredAlumnos.map((alumno) => (
                                <button
                                    key={alumno.id}
                                    onClick={() => {
                                        setSelectedAlumno(alumno)
                                        setSearchQuery(`${alumno.nombre} ${alumno.primer_apellido || ''} ${alumno.segundo_apellido || ''}`.trim())
                                    }}
                                    className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                                >
                                    <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-white transition-colors">
                                        <User className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">
                                            {alumno.nombre} {alumno.primer_apellido} {alumno.segundo_apellido}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {searchQuery.trim() && filteredAlumnos.length === 0 && !selectedAlumno && (
                         <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-6 text-center text-slate-500 font-medium text-sm">
                            No se han encontrado alumnos con esos datos.
                         </div>
                    )}
                </div>

                {/* Tutor Cards Section */}
                {selectedAlumno && (
                    <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tutores de {selectedAlumno.nombre}</h2>
                            <p className="text-sm font-medium text-slate-500">Selecciona a quién deseas bloquear o restaurar las notificaciones</p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {renderTutorCard(1)}
                            {renderTutorCard(2)}
                        </div>
                    </div>
                )}
                
                {!selectedAlumno && (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <div className="bg-slate-50 p-4 rounded-[2rem] mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">Ningún alumno seleccionado</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-sm mt-1">
                            Utiliza el buscador de arriba para encontrar al alumno y gestionar las notificaciones de sus tutores.
                        </p>
                    </div>
                )}
            </div>

            {/* List of Blocked Tutors Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 p-8">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tutores Excluidos</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Listado de tutores que actualmente no reciben notificaciones de incidencias.</p>
                        </div>
                        <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase self-start sm:self-auto border border-rose-100 shadow-sm">
                            {notificaciones.length} {notificaciones.length === 1 ? 'Excluido' : 'Excluidos'}
                        </div>
                    </div>

                    {notificaciones.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <h3 className="text-lg font-black text-slate-900">Todos activos</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mt-1">
                                Actualmente no hay ningún tutor excluido de las notificaciones.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notificaciones.map((notif) => {
                                const alumno = alumnos.find(a => a.id === notif.alumno_id)
                                const isLoading = loading === `${notif.alumno_id}-${notif.tutor_indice}`

                                return (
                                    <div key={notif.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border-b border-l border-rose-100">
                                            Excluido
                                        </div>
                                        
                                        <div className="flex items-start gap-4 mt-2">
                                            <div className="bg-rose-50 p-2.5 rounded-2xl border border-rose-100">
                                                <BellOff className="w-5 h-5 text-rose-500" />
                                            </div>
                                            <div className="flex-1 pr-12">
                                                <h3 className="text-sm font-black text-slate-900 leading-tight">
                                                    {notif.tutor_nombre || `Tutor ${notif.tutor_indice}`}
                                                </h3>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                                    Padre/Madre de: 
                                                    <span className="text-slate-600 block mt-0.5 truncate">
                                                        {alumno ? `${alumno.nombre} ${alumno.primer_apellido}` : 'Alumno no encontrado'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-2.5">
                                             <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{notif.email || <span className="text-slate-400 italic">No especificado</span>}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span>{notif.telefono || <span className="text-slate-400 italic">No especificado</span>}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => alumno && handleToggleNotificacion(alumno, notif.tutor_indice)}
                                            disabled={isLoading || !alumno}
                                            className={`mt-6 w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                                                isLoading || !alumno 
                                                ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-200 text-slate-400' 
                                                : 'bg-white text-rose-600 hover:bg-rose-50 border-2 border-rose-100 hover:border-rose-200 active:scale-95 shadow-sm'
                                            }`}
                                        >
                                            {isLoading ? (
                                                'Procesando...'
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Restaurar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
            </div>
        </div>
    )
}
