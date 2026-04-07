'use client'

import { Printer, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

// Mapa de abreviaturas de mes en español a número de mes
const MESES_ES: Record<string, string> = {
    ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06',
    jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12'
};

// Convierte la fecha del servidor (ej: "7 abr 2026, 13:00") a "DD/MM/AAAA" y "HH:MM"
function parseFecha(fecha: string): { fechaDia: string; hora: string } {
    const [datePart, timePart] = fecha.split(', ');
    const parts = datePart?.trim().split(' ') || [];
    const day = (parts[0] || '').padStart(2, '0');
    const month = MESES_ES[parts[1]?.toLowerCase() || ''] || parts[1] || '';
    const year = parts[2] || '';
    return { fechaDia: `${day}/${month}/${year}`, hora: timePart || '' };
}

export default function ExitoClient({ alumno, curso, fecha, emails, obs }: { alumno: string, curso: string, fecha: string, emails?: string, obs?: string }) {
    let emailStatus: { email: string, ok: boolean }[] = [];
    if (emails) {
        try {
            emailStatus = JSON.parse(decodeURIComponent(emails));
        } catch (e) { }
    }
    const { fechaDia, hora } = parseFecha(fecha);
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

            {/* Regla CSS para márgenes de impresión */}
            <style>{`@page { margin: 1cm 1cm 1cm 1cm; }`}</style>

            {/* VISTA DE IMPRESIÓN (Oculta en pantalla, visible solo al imprimir) */}
            <div className="hidden print:block w-full max-w-[21cm] mx-auto bg-white h-[14.8cm] relative font-serif">
                {/* Cabecera */}
                <div className="flex justify-center items-start mb-4">
                    <div>
                        <h1 className="text-base font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 text-center">
                            REGISTRO DE ENTRADA TARDE AL CENTRO
                        </h1>
                    </div>
                </div>

                {/* Cuerpo del Justificante */}
                <div className="space-y-10 text-lg text-slate-900 mt-6 px-4">
                    <div className="flex items-end gap-3 leading-tight">
                        <span className="whitespace-nowrap pb-1">El alumno/a:</span>
                        <div className="flex-1 border-b border-slate-400 font-bold px-4 text-xl pb-1">
                            {alumno}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-y-8 gap-x-4 leading-tight">
                        <div className="flex items-end gap-3">
                            <span className="whitespace-nowrap pb-1">del grupo:</span>
                            <div className="min-w-[140px] border-b border-slate-400 font-bold px-2 text-center pb-1">
                                {curso || '—'}
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <span className="whitespace-nowrap pb-1">ha llegado al instituto el día:</span>
                            <div className="min-w-[180px] border-b border-slate-400 font-bold px-2 text-center pb-1">
                                {fechaDia}
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <span className="whitespace-nowrap pb-1">a las:</span>
                            <div className="min-w-[100px] border-b border-slate-400 font-bold px-2 text-center pb-1">
                                {hora}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10">
                        <p className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                            Observaciones del equipo directivo:
                        </p>
                        {obs ? (
                            <p className="text-base text-slate-800 leading-relaxed border-b border-slate-300 pb-2">
                                {decodeURIComponent(obs)}
                            </p>
                        ) : (
                            <div className="space-y-10">
                                <div className="border-b border-slate-300 w-full"></div>
                                <div className="border-b border-slate-300 w-full"></div>
                                <div className="border-b border-slate-300 w-full"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
