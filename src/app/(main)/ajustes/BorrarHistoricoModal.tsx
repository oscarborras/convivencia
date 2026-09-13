'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getHistorialCounts, resetHistorialConvivencia } from './actions'

const CONFIRM_PHRASE = 'BORRAR HISTORIAL'

export default function BorrarHistoricoModal() {
    const [open, setOpen] = useState(false)
    const [loadingCounts, setLoadingCounts] = useState(false)
    const [counts, setCounts] = useState<{ partes: number; retrasos: number } | null>(null)
    const [confirmText, setConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)

    async function handleOpen() {
        setConfirmText('')
        setOpen(true)
        setLoadingCounts(true)
        try {
            const data = await getHistorialCounts()
            setCounts(data)
        } catch (error) {
            console.error('Error al obtener el recuento del histórico:', error)
            toast.error('No se pudo obtener el recuento actual')
        } finally {
            setLoadingCounts(false)
        }
    }

    function handleClose() {
        if (deleting) return
        setOpen(false)
    }

    async function handleConfirmDelete() {
        setDeleting(true)
        try {
            const result = await resetHistorialConvivencia()
            toast.success(`Histórico borrado: ${result.partesBorrados} partes y ${result.retrasosBorrados} retrasos eliminados`)
            setOpen(false)
        } catch (error) {
            console.error('Error al borrar el histórico:', error)
            toast.error(error instanceof Error ? error.message : 'Error al borrar el histórico')
        } finally {
            setDeleting(false)
        }
    }

    const canConfirm = confirmText.trim() === CONFIRM_PHRASE && !deleting && !loadingCounts

    return (
        <>
            <button
                onClick={handleOpen}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-95"
            >
                <Trash2 className="w-4 h-4" />
                Borrar Histórico de Partes y Retrasos
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-rose-100 bg-rose-50/50 flex items-start gap-4">
                            <div className="bg-rose-100 p-3 rounded-2xl text-rose-600 shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-black text-slate-900 text-lg">Borrar histórico de convivencia</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Esta acción es irreversible. Se borrarán permanentemente todos los partes y retrasos registrados.
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={deleting}
                                className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                    <p className="text-2xl font-black text-slate-900 h-8 flex items-center justify-center">
                                        {loadingCounts ? <Loader2 className="w-5 h-5 animate-spin" /> : (counts?.partes ?? '—')}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Partes</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                                    <p className="text-2xl font-black text-slate-900 h-8 flex items-center justify-center">
                                        {loadingCounts ? <Loader2 className="w-5 h-5 animate-spin" /> : (counts?.retrasos ?? '—')}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Retrasos</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-2xl p-4 leading-relaxed">
                                Recomendado: genera antes los informes en PDF desde <strong>Generar Informe</strong> si necesitas conservar un registro del curso, ya que esta acción no se puede deshacer.
                            </p>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Escribe <span className="text-rose-600">{CONFIRM_PHRASE}</span> para confirmar
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder={CONFIRM_PHRASE}
                                    disabled={deleting}
                                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 rounded-2xl px-4 py-2.5 transition-all text-slate-700 outline-none disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                disabled={deleting}
                                className="px-5 py-2.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={!canConfirm}
                                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {deleting ? 'Borrando...' : 'Borrar definitivamente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
