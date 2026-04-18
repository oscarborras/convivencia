'use client'

import { useState } from 'react'
import { X, Copy, Check, Users } from 'lucide-react'

export default function ProfesoresActivosModal({ nombres, emails }: { nombres: string[]; emails: string[] }) {
    const [open, setOpen] = useState(false)
    const [copiedNombres, setCopiedNombres] = useState(false)
    const [copiedEmails, setCopiedEmails] = useState(false)

    const textoNombres = nombres.join('\n')
    const textoEmails = emails.join('\n')

    const handleCopyNombres = async () => {
        await navigator.clipboard.writeText(textoNombres)
        setCopiedNombres(true)
        setTimeout(() => setCopiedNombres(false), 2000)
    }

    const handleCopyEmails = async () => {
        await navigator.clipboard.writeText(textoEmails)
        setCopiedEmails(true)
        setTimeout(() => setCopiedEmails(false), 2000)
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
                <Users className="w-4 h-4" />
                Profes. Activos
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h2 className="font-bold text-slate-900">Profesores activos</h2>
                                <p className="text-xs text-slate-400">{nombres.length} profesores</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyEmails}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                        copiedEmails
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {copiedEmails ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedEmails ? 'Copiado' : 'Copiar emails'}
                                </button>
                                <button
                                    onClick={handleCopyNombres}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                        copiedNombres
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {copiedNombres ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copiedNombres ? 'Copiado' : 'Copiar nombres'}
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Lista */}
                        <textarea
                            readOnly
                            value={textoNombres}
                            onClick={e => (e.target as HTMLTextAreaElement).select()}
                            className="flex-1 w-full p-5 text-sm text-slate-800 font-mono resize-none focus:outline-none rounded-b-2xl"
                            style={{ minHeight: '300px' }}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
