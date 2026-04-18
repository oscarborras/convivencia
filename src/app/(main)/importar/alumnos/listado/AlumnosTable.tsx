'use client'

import { useState } from 'react'
import { X, User, Mail, Phone, BookOpen, Calendar, Users } from 'lucide-react'

export type Alumno = {
    id: string
    alumno: string
    unidad: string | null
    sexo: string | null
    email_personal: string | null
    edad_matricula: string | null
    fecha_matricula: string | null
    estado_matricula: string | null
    primer_apellido: string | null
    segundo_apellido: string | null
    nombre: string | null
    tutor1_primer_apellido: string | null
    tutor1_segundo_apellido: string | null
    tutor1_nombre: string | null
    tutor1_email: string | null
    tutor1_telefono: string | null
    tutor1_sexo: string | null
    tutor2_primer_apellido: string | null
    tutor2_segundo_apellido: string | null
    tutor2_nombre: string | null
    tutor2_email: string | null
    tutor2_telefono: string | null
    tutor2_sexo: string | null
}

function tutorNombre(a: Alumno, n: 1 | 2) {
    const p = n === 1 ? a.tutor1_primer_apellido : a.tutor2_primer_apellido
    const s = n === 1 ? a.tutor1_segundo_apellido : a.tutor2_segundo_apellido
    const nom = n === 1 ? a.tutor1_nombre : a.tutor2_nombre
    return [p, s, ",", nom].filter(Boolean).join(' ') || null
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

function TutorSection({ alumno, n }: { alumno: Alumno; n: 1 | 2 }) {
    const nombre = tutorNombre(alumno, n)
    const email = n === 1 ? alumno.tutor1_email : alumno.tutor2_email
    const telefono = n === 1 ? alumno.tutor1_telefono : alumno.tutor2_telefono
    if (!nombre && !email && !telefono) return null
    return (
        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Tutor {n}
            </p>
            {nombre && <Field label="Nombre" value={nombre} />}
            {email && (
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                    <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline">{email}</a>
                </div>
            )}
            {telefono && <Field label="Teléfono" value={telefono} />}
        </div>
    )
}

export default function AlumnosTable({ alumnos }: { alumnos: Alumno[] }) {
    const [selected, setSelected] = useState<Alumno | null>(null)

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="px-5 py-3.5 text-left">Alumno</th>
                            <th className="px-5 py-3.5 text-left">Unidad</th>
                            <th className="px-5 py-3.5 text-left">Sexo</th>
                            <th className="px-5 py-3.5 text-left">Edad</th>
                            <th className="px-5 py-3.5 text-left">Email personal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {alumnos.map((a) => (
                            <tr
                                key={a.id}
                                onClick={() => setSelected(a)}
                                className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                            >
                                <td className="px-5 py-3 font-medium text-slate-800">{a.alumno}</td>
                                <td className="px-5 py-3">
                                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                        {a.unidad || '—'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{a.sexo || '—'}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{a.edad_matricula || '—'}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{a.email_personal || <span className="text-slate-300 italic">—</span>}</td>
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
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900 text-lg leading-tight">{selected.alumno}</h2>
                                    {selected.unidad && (
                                        <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                            {selected.unidad}
                                        </span>
                                    )}
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
                            {/* Datos personales */}
                            <div className="space-y-3">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" /> Datos del alumno
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Nombre" value={selected.nombre} />
                                    <Field label="Primer apellido" value={selected.primer_apellido} />
                                    <Field label="Segundo apellido" value={selected.segundo_apellido} />
                                    <Field label="Sexo" value={selected.sexo} />
                                    <Field label="Edad" value={selected.edad_matricula} />
                                    <Field label="Estado matrícula" value={selected.estado_matricula || 'Activo'} />
                                </div>
                            </div>

                            {/* Fecha matrícula */}
                            {selected.fecha_matricula && (
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Matrícula
                                    </p>
                                    <Field label="Fecha de matrícula" value={selected.fecha_matricula} />
                                </div>
                            )}

                            {/* Contacto alumno */}
                            {selected.email_personal && (
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Contacto
                                    </p>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email personal</p>
                                        <a href={`mailto:${selected.email_personal}`} className="text-sm text-blue-600 hover:underline">
                                            {selected.email_personal}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Tutores */}
                            {(tutorNombre(selected, 1) || selected.tutor1_email || selected.tutor1_telefono ||
                                tutorNombre(selected, 2) || selected.tutor2_email || selected.tutor2_telefono) && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> Tutores legales
                                        </p>
                                        <TutorSection alumno={selected} n={1} />
                                        <TutorSection alumno={selected} n={2} />
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
