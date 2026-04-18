'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, CheckCircle, Save, Info, RefreshCw, ChevronRight, X, Mail, FileText, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { previewProfesoresUpdate, applyProfesoresUpdate, insertNewProfesores, getProfesoresNullEmail, updateProfesoresEmails } from './actions'
import type { UpdateItem, NullEmailProfesor, CsvRow } from './actions'

type Step = 'upload' | 'preview' | 'insert' | 'emails'

const parseFecha = (s: string): string | undefined => {
    if (!s?.trim()) return undefined
    const parts = s.trim().split('/')
    if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    return undefined
}

const formatFecha = (s?: string | null): string => {
    if (!s) return '—'
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
}

export default function ImportClient({ initialCount, lastUpdate }: { initialCount: number; lastUpdate: string | null }) {
    const [step, setStep] = useState<Step>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [updates, setUpdates] = useState<UpdateItem[]>([])
    const [newProfesores, setNewProfesores] = useState<CsvRow[]>([])
    const [csvTotal, setCsvTotal] = useState(0)
    const [loading, setLoading] = useState(false)

    const [nullEmailProfs, setNullEmailProfs] = useState<NullEmailProfesor[]>([])
    const [emailModal, setEmailModal] = useState(false)
    const [emailInputs, setEmailInputs] = useState<Record<string, string>>({})
    const [done, setDone] = useState(false)

    const parseCSV = useCallback((text: string): CsvRow[] => {
        const lines = text.split('\n').filter(l => l.trim())
        const sep = lines[0]?.includes(';') ? ';' : ','

        const parseLine = (line: string): string[] => {
            const result: string[] = []
            let inQuotes = false
            let current = ''
            for (const ch of line) {
                if (ch === '"') { inQuotes = !inQuotes }
                else if (ch === sep && !inQuotes) { result.push(current); current = '' }
                else { current += ch }
            }
            result.push(current)
            return result.map(p => p.trim())
        }

        let startIdx = 0
        const firstLine = lines[0]?.toLowerCase() || ''
        if (firstLine.includes('empleado') || firstLine.includes('puesto')) startIdx = 1

        const rows: CsvRow[] = []
        for (let i = startIdx; i < lines.length; i++) {
            const parts = parseLine(lines[i].trim())
            if (parts.length < 3 || !parts[0]) continue
            rows.push({
                profesor: parts[0],
                puesto: parts[2] || '',
                fecha_alta: parseFecha(parts[3] || ''),
                fecha_cese: parseFecha(parts[4] || ''),
            })
        }
        return rows
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setLoading(true)

        const reader = new FileReader()
        reader.onload = async (ev) => {
            const text = ev.target?.result as string
            const rows = parseCSV(text)
            setCsvTotal(rows.length)

            const result = await previewProfesoresUpdate(rows)
            setLoading(false)
            if (result.error) {
                toast.error(result.error)
                return
            }
            setUpdates(result.updates)
            setNewProfesores(result.newProfesores)
            setStep('preview')
        }
        reader.readAsText(f)
    }

    const handleConfirmUpdates = async () => {
        if (updates.length > 0) {
            setLoading(true)
            const result = await applyProfesoresUpdate(updates)
            setLoading(false)
            if (result.error) {
                toast.error(result.error)
                return
            }
            toast.success(`${result.count} profesores actualizados.`)
        }
        setStep('insert')
    }

    const handleConfirmInsert = async () => {
        if (newProfesores.length > 0) {
            setLoading(true)
            const result = await insertNewProfesores(newProfesores)
            setLoading(false)
            if (result.error) {
                toast.error(result.error)
                return
            }
            toast.success(`${result.count} profesores añadidos.`)
        }
        await loadEmailStep()
    }

    const loadEmailStep = async () => {
        setLoading(true)
        const result = await getProfesoresNullEmail()
        setLoading(false)
        if (result.error) {
            toast.error(result.error)
            setDone(true)
            return
        }
        const inputs: Record<string, string> = {}
        result.profesores.forEach(p => { inputs[p.id] = '' })
        setNullEmailProfs(result.profesores)
        setEmailInputs(inputs)
        setStep('emails')
    }

    const handleSaveEmails = async () => {
        const toUpdate = Object.entries(emailInputs)
            .filter(([, email]) => email.trim())
            .map(([id, email]) => ({ id, email }))

        if (toUpdate.length === 0) {
            toast.error('No has introducido ningún email.')
            return
        }
        setLoading(true)
        const result = await updateProfesoresEmails(toUpdate)
        setLoading(false)
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success(`${result.count} emails guardados correctamente.`)
        setEmailModal(false)
        setDone(true)
    }

    const resetAll = () => {
        setStep('upload')
        setFile(null)
        setUpdates([])
        setNewProfesores([])
        setCsvTotal(0)
        setNullEmailProfs([])
        setEmailInputs({})
        setDone(false)
    }

    const steps: Step[] = ['upload', 'preview', 'insert', 'emails']
    const stepLabels = ['Subir archivo', 'Actualizar', 'Nuevos', 'Emails']

    if (done) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Importación completada</h2>
                <p className="text-slate-500 mb-8">Todos los cambios han sido aplicados correctamente.</p>
                <button onClick={resetAll}
                    className="bg-primary-brand text-white px-7 py-2.5 rounded-xl font-semibold hover:bg-primary-light transition-all shadow-sm shadow-primary-brand/20">
                    Nueva importación
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
                {steps.map((s, i) => {
                    const currentIdx = steps.indexOf(step)
                    const isActive = step === s
                    const isPast = currentIdx > i
                    return (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold transition-all ${isActive
                                ? 'bg-primary-brand text-white shadow-sm shadow-primary-brand/30'
                                : isPast
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isPast
                                    ? <CheckCircle className="w-3.5 h-3.5" />
                                    : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                                }
                                {stepLabels[i]}
                            </div>
                            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                        </div>
                    )
                })}
            </div>

            {/* ── STEP 1: Upload ── */}
            {step === 'upload' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="bg-primary-brand/10 p-3 rounded-xl text-primary-brand">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profesores registrados</p>
                                <p className="text-2xl font-black text-slate-900">{initialCount}</p>
                            </div>
                        </div>
                        {lastUpdate && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                                <div className="bg-slate-100 p-3 rounded-xl text-slate-500">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Última actualización</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {new Date(lastUpdate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                        <div className="mb-6 p-4 rounded-xl bg-primary-brand/5 border border-primary-brand/20 flex gap-3 items-start">
                            <Info className="w-5 h-5 text-primary-brand shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600">
                                Sube el CSV exportado de la pestaña <strong>Séneca</strong>. Se usarán las columnas
                                {' '}<strong>Empleado/a, Puesto, Fecha de toma de posesión y Fecha de cese</strong>. El resto se ignoran.
                            </p>
                        </div>

                        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-14 text-center hover:border-primary-brand transition-colors group cursor-pointer">
                            <input type="file" accept=".csv" onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={loading} />
                            <div className="flex flex-col items-center pointer-events-none">
                                {loading
                                    ? <RefreshCw className="w-12 h-12 text-primary-brand animate-spin mb-4" />
                                    : <UploadCloud className="w-12 h-12 text-slate-300 group-hover:text-primary-brand mb-4 transition-colors" />
                                }
                                <p className="text-slate-600 font-semibold text-lg">
                                    {loading ? 'Analizando...' : 'Arrastra el CSV aquí o haz clic para seleccionar'}
                                </p>
                                <p className="text-slate-400 text-sm mt-1">Formato CSV separado por punto y coma o coma</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Preview ── */}
            {step === 'preview' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filas en CSV</p>
                            <p className="text-3xl font-black text-slate-900">{csvTotal}</p>
                        </div>
                        <div className={`bg-white rounded-2xl border p-5 ${updates.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">A actualizar</p>
                            <p className="text-3xl font-black text-slate-900">{updates.length}</p>
                            <p className="text-sm text-slate-500">profesores</p>
                        </div>
                        <div className={`bg-white rounded-2xl border p-5 ${newProfesores.length > 0 ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">A insertar</p>
                            <p className="text-3xl font-black text-slate-900">{newProfesores.length}</p>
                            <p className="text-sm text-slate-500">nuevos</p>
                        </div>
                    </div>

                    {updates.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Cambios pendientes</h3>
                                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">
                                    {updates.length} registros
                                </span>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left">Profesor</th>
                                            <th className="px-5 py-3 text-left">Motivo</th>
                                            <th className="px-5 py-3 text-left">Campo</th>
                                            <th className="px-5 py-3 text-left">Valor actual</th>
                                            <th className="px-5 py-3 text-left">Nuevo valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {updates.flatMap((u, i) =>
                                            Object.entries(u.changes).map(([field, val], j) => (
                                                <tr key={`${i}-${j}`} className="hover:bg-slate-50/50">
                                                    {j === 0 && (
                                                        <td className="px-5 py-2.5 font-medium text-slate-800 align-top" rowSpan={Object.keys(u.changes).length}>
                                                            {u.profesor}
                                                        </td>
                                                    )}
                                                    {j === 0 && (
                                                        <td className="px-5 py-2.5 align-top" rowSpan={Object.keys(u.changes).length}>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${u.reason === 'campos_vacios'
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-green-50 text-green-600'
                                                                }`}>
                                                                {u.reason === 'campos_vacios' ? 'Campos vacíos' : 'Contrato renovado'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="px-5 py-2.5 text-slate-500 text-xs font-mono">{field}</td>
                                                    <td className="px-5 py-2.5 text-slate-400 text-xs">
                                                        {field === 'fecha_alta' || field === 'fecha_cese'
                                                            ? formatFecha(u.current[field as keyof typeof u.current])
                                                            : u.current[field as keyof typeof u.current] || <span className="italic">null</span>
                                                        }
                                                    </td>
                                                    <td className="px-5 py-2.5 font-semibold text-slate-800 text-xs">
                                                        {field === 'fecha_alta' || field === 'fecha_cese'
                                                            ? formatFecha(val as string | null)
                                                            : (val ?? <span className="italic text-slate-400">null</span>)
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">Todos los profesores están actualizados. No hay cambios necesarios.</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button onClick={() => { setStep('upload'); setFile(null) }}
                            className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-900 transition-colors">
                            ← Volver
                        </button>
                        <button onClick={handleConfirmUpdates} disabled={loading}
                            className="bg-primary-brand text-white px-7 py-2.5 rounded-xl font-semibold hover:bg-primary-light transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-brand/20">
                            {loading
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Aplicando...</>
                                : updates.length > 0
                                    ? <><Save className="w-4 h-4" /> Confirmar {updates.length} actualizaciones</>
                                    : <>Continuar →</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Insert new professors ── */}
            {step === 'insert' && (
                <div className="space-y-5">
                    {newProfesores.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between bg-green-50/50">
                                <h3 className="font-bold text-slate-900">Nuevos profesores a insertar</h3>
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                                    {newProfesores.length} registros
                                </span>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left">Profesor</th>
                                            <th className="px-5 py-3 text-left">Puesto</th>
                                            <th className="px-5 py-3 text-left">Fecha Alta</th>
                                            <th className="px-5 py-3 text-left">Fecha Cese</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {newProfesores.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">{p.profesor}</td>
                                                <td className="px-5 py-2.5 text-slate-600 text-xs">{p.puesto || '—'}</td>
                                                <td className="px-5 py-2.5 text-slate-500 text-xs">{formatFecha(p.fecha_alta)}</td>
                                                <td className="px-5 py-2.5 text-slate-500 text-xs">{formatFecha(p.fecha_cese)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">Todos los profesores del CSV ya están en la base de datos.</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <button onClick={() => setStep('preview')}
                            className="px-5 py-2.5 text-slate-500 font-medium hover:text-slate-900 transition-colors">
                            ← Volver
                        </button>
                        <button onClick={handleConfirmInsert} disabled={loading}
                            className="bg-primary-brand text-white px-7 py-2.5 rounded-xl font-semibold hover:bg-primary-light transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-brand/20">
                            {loading
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Insertando...</>
                                : newProfesores.length > 0
                                    ? <><Save className="w-4 h-4" /> Confirmar {newProfesores.length} inserciones</>
                                    : <>Continuar →</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 4: Emails ── */}
            {step === 'emails' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${nullEmailProfs.length > 0 ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Profesores sin email</h3>
                            {nullEmailProfs.length === 0 ? (
                                <p className="text-slate-500 mt-1">Todos los profesores tienen email registrado.</p>
                            ) : (
                                <p className="text-slate-500 mt-1">
                                    Hay{' '}
                                    <strong className="text-slate-800 text-lg">{nullEmailProfs.length}</strong>
                                    {' '}profesores sin email en la base de datos.
                                </p>
                            )}
                        </div>
                    </div>

                    {nullEmailProfs.length > 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700">
                                Sin email, estos profesores no recibirán notificaciones de los partes. Puedes añadirlos ahora o hacerlo más adelante desde el listado de profesores.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button onClick={() => setDone(true)}
                            className="text-slate-400 hover:text-slate-600 font-medium transition-colors text-sm">
                            {nullEmailProfs.length === 0 ? 'Finalizar' : 'Omitir y finalizar'}
                        </button>
                        {nullEmailProfs.length > 0 && (
                            <button onClick={() => setEmailModal(true)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
                                <Mail className="w-4 h-4" />
                                Añadir emails ({nullEmailProfs.length})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Email modal ── */}
            {emailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Añadir emails</h3>
                                <p className="text-sm text-slate-500">{nullEmailProfs.length} profesores sin email registrado</p>
                            </div>
                            <button onClick={() => setEmailModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                            {nullEmailProfs.map(prof => (
                                <div key={prof.id} className="flex items-center gap-3 py-1">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{prof.profesor}</p>
                                        {prof.puesto && <p className="text-xs text-slate-400 truncate">{prof.puesto}</p>}
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="correo@iesjulioverne.es"
                                        value={emailInputs[prof.id] || ''}
                                        onChange={e => setEmailInputs(prev => ({ ...prev, [prof.id]: e.target.value }))}
                                        className="w-72 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-brand/30 focus:border-primary-brand transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-xs text-slate-400">
                                {Object.values(emailInputs).filter(e => e.trim()).length} de {nullEmailProfs.length} completados
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setEmailModal(false)}
                                    className="px-5 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveEmails} disabled={loading}
                                    className="bg-primary-brand text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-light transition-all flex items-center gap-2 disabled:opacity-50">
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar emails
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
