'use client'

import { Printer, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function ExitoClient({ alumno, curso, fecha, emails }: { alumno: string, curso: string, fecha: string, emails?: string }) {
    let emailStatus: { email: string, ok: boolean }[] = [];
    if (emails) {
        try {
            emailStatus = JSON.parse(decodeURIComponent(emails));
        } catch(e) {}
    }
    return (
        <div className="max-w-3xl mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 print:p-0 print:m-0 print:min-h-0 print:block">
            {/* VISTA EN PANTALLA (No imprime) */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center w-full max-w-lg print:hidden">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Registro Guardado</h1>
                <p className="text-gray-500 mb-6">
                    El retraso de <strong>{alumno}</strong> se ha registrado correctamente en el sistema y se han enviado las notificaciones.
                </p>

                {emailStatus.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            Estado de Notificaciones
                        </h3>
                        <ul className="space-y-3">
                            {emailStatus.map((st, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    {st.ok ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    )}
                                    <span className={st.ok ? "text-gray-700 font-medium" : "text-gray-500 line-through truncate"}>
                                        {st.email}
                                    </span>
                                    {!st.ok && (
                                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold ml-auto shrink-0">
                                            Error
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bg-blue-50/50 rounded-2xl p-6 mb-8 text-left border border-blue-100">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                        <Printer className="w-5 h-5 text-blue-600" />
                        ¿Necesitas comprobante?
                    </h3>
                    <p className="text-sm text-blue-700/80 mb-4">
                        Puedes imprimir un justificante para que el alumno lo entregue al profesorado confirmando que ha pasado a justificar su retraso por jefatura.
                    </p>
                    <button
                        onClick={() => window.print()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir Justificante
                    </button>
                </div>

                <Link
                    href="/dashboard"
                    className="flex justify-center items-center gap-2 text-gray-400 hover:text-gray-800 font-bold py-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Inicio
                </Link>
            </div>

            {/* VISTA DE IMPRESIÓN (Oculta en pantalla, visible solo al imprimir) */}
            <div className="hidden print:block w-full max-w-3xl mx-auto p-12 print:p-0 h-auto break-inside-avoid">
                <div className="text-center mb-12 border-b-2 border-slate-900 pb-8">
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-display, sans-serif)' }}>
                        Convivencia
                    </h1>
                    <h2 className="text-lg font-bold text-slate-500 uppercase tracking-[0.15em]">
                        IES Julio Verne - Gestión Escolar
                    </h2>
                </div>

                <div className="space-y-8 mt-12 px-4">
                    <h3 className="text-3xl font-bold text-slate-900 text-center mb-12 underline underline-offset-8">
                        Comprobante de Incorporación al Centro
                    </h3>

                    <p className="text-xl leading-loose text-slate-900 text-justify">
                        Por medio del presente se acredita que el alumno/a <strong>{alumno}</strong>
                        {curso && <span> matriculado/a en el grupo <strong>{curso}</strong></span>}, 
                        se ha presentado en estas dependencias para registrar su entrada en el centro, a fecha y hora: <span className="font-bold whitespace-nowrap">{fecha}</span>.
                    </p>

                    <p className="text-xl leading-loose text-slate-900 text-justify mt-8">
                        Su incorporación con retraso ha quedado oficialmente documentada en el sistema. 
                        Con el porte de este documento provisional, el profesorado podrá permitir 
                        su incorporación inmediata al aula o actividades lectivas correspondientes, salvo indicación contraria por Normativa de Centro.
                    </p>
                </div>

                <div className="mt-32 pt-12 grid grid-cols-2 gap-16 text-center">
                    <div>
                        <div className="h-0 border-t-2 border-slate-800 w-64 mx-auto border-dashed"></div>
                        <p className="mt-4 font-bold text-slate-600 text-lg uppercase">Sello del Centro</p>
                    </div>
                    <div>
                        <div className="h-0 border-t-2 border-slate-800 w-64 mx-auto border-dashed"></div>
                        <p className="mt-4 font-bold text-slate-600 text-lg uppercase">Firma o Visto Bueno</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
