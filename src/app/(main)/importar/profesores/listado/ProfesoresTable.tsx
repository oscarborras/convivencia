'use client'

import { useState } from 'react'
import { X, Briefcase, Mail, Calendar } from 'lucide-react'

export type Profesor = {
    id: string
    profesor: string
    puesto: string | null
    email: string | null
    fecha_alta: string | null
    fecha_cese: string | null
}

const formatFecha = (s?: string | null) => {
    if (!s) return null
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null
    return (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-slate-800">{value}</p>
        </div>
    )
}

export default function ProfesoresTable({ profesores }: { profesores: Profesor[] }) {
    const [selected, setSelected] = useState<Profesor | null>(null)

    const today = new Date().toISOString().slice(0, 10)
    const isActivo = (p: Profesor) => !p.fecha_cese || p.fecha_cese > today

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="px-5 py-3.5 text-left">Nombre</th>
                            <th className="px-5 py-3.5 text-left">Puesto</th>
                            <th className="px-5 py-3.5 text-left">Email</th>
                            <th className="px-5 py-3.5 text-left">Fecha Alta</th>
                            <th className="px-5 py-3.5 text-left">Fecha Cese</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {profesores.map((p) => (
                            <tr
                                key={p.id}
                                onClick={() => setSelected(p)}
                                className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                            >
                                <td className="px-5 py-3 font-medium text-slate-800">{p.profesor}</td>
                                <td className="px-5 py-3 text-slate-600 text-xs">{p.puesto || <span className="text-slate-300 italic">—</span>}</td>
                                <td className="px-5 py-3">
                                    {p.email
                                        ? <span className="text-slate-600 text-xs">{p.email}</span>
                                        : <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">Sin email</span>
                                    }
                                </td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{formatFecha(p.fecha_alta) || '—'}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{formatFecha(p.fecha_cese) || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg leading-tight">{selected.profesor}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {selected.puesto && (
                                            <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                                                {selected.puesto}
                                            </span>
                                        )}
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActivo(selected) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {isActivo(selected) ? 'Activo' : 'Cesado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Contacto */}
                            <div className="space-y-3">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" /> Contacto
                                </p>
                                {selected.email ? (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                                        <a href={`mailto:${selected.email}`} className="text-sm text-blue-600 hover:underline">
                                            {selected.email}
                                        </a>
                                    </div>
                                ) : (
                                    <p className="text-sm text-amber-600 font-medium">Sin email registrado</p>
                                )}
                            </div>

                            {/* Fechas */}
                            <div className="space-y-3">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Contrato
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Fecha de alta" value={formatFecha(selected.fecha_alta)} />
                                    <Field label="Fecha de cese" value={formatFecha(selected.fecha_cese)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
