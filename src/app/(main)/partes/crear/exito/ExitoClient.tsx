'use client'

import { ArrowLeft, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function ExitoClient({ alumno, emails }: { alumno: string, emails?: string }) {
    let emailStatus: { email: string, label: string, ok: boolean }[] = [];
    if (emails) {
        try {
            emailStatus = JSON.parse(decodeURIComponent(emails));
        } catch(e) {}
    }
    
    return (
        <div className="max-w-3xl mx-auto min-h-[60vh] flex flex-col items-center justify-center p-6 print:p-0 print:m-0 print:min-h-0 print:block">
            {/* VISTA EN PANTALLA (No imprime) */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center w-full max-w-lg print:hidden">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Parte Guardado</h1>
                <p className="text-gray-500 mb-6">
                    El parte disciplinario correspondiente a <strong>{alumno}</strong> se ha registrado correctamente en el sistema y se han enviado las notificaciones.
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
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                                            {st.label}
                                        </span>
                                        <span className={st.ok ? "text-gray-700 font-medium truncate" : "text-gray-500 line-through truncate"}>
                                            {st.email}
                                        </span>
                                    </div>
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

                <Link
                    href="/dashboard"
                    className="flex justify-center items-center gap-2 text-gray-400 hover:text-gray-800 font-bold py-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Inicio
                </Link>
            </div>
        </div>
    )
}
