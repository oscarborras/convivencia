'use client'

import { useState, useCallback } from 'react'
import { UploadCloud, CheckCircle, Save, Info, RefreshCw, ChevronRight, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'
import { previewAlumnosUpdate, applyAlumnosUpdate, insertNewAlumnos } from './actions'
import type { UpdateItem, CsvRow } from './actions'

type Step = 'upload' | 'preview' | 'insert'

export default function ImportClient({ totalCount, activeCount, lastUpdate }: { totalCount: number; activeCount: number; lastUpdate: string | null }) {
    const [step, setStep] = useState<Step>('upload')
    const [, setFile] = useState<File | null>(null)
    const [toUpdate, setToUpdate] = useState<UpdateItem[]>([])
    const [toInsert, setToInsert] = useState<CsvRow[]>([])
    const [csvTotal, setCsvTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const parseCSV = useCallback((text: string): CsvRow[] => {
        const lines = text.split('\n').filter(l => l.trim())
        const headerLine = lines[0] || ''
        const sep = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ','

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
            return result.map(p => p.replace(/^["']|["']$/g, '').trim())
        }

        const normalize = (s: string) =>
            s.replace(/^["']|["']$/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

        const headers = parseLine(headerLine)
        const headerIndex = new Map<string, number>()
        headers.forEach((h, idx) => headerIndex.set(normalize(h), idx))

        const getValue = (parts: string[], keys: string[]) => {
            for (const key of keys) {
                const idx = headerIndex.get(normalize(key))
                if (idx !== undefined && parts[idx] !== undefined) {
                    return parts[idx].trim() || undefined
                }
            }
            return undefined
        }

        const rows: CsvRow[] = []
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue
            const parts = parseLine(line)

            const alumno = getValue(parts, ['alumno/a', 'alumno']) ?? getValue(parts, ['nombre'])
            if (!alumno) continue

            const estadoMatricula = getValue(parts, ['estado matrícula', 'estado matricula'])
            if (estadoMatricula) continue  // skip non-active students

            rows.push({
                alumno,
                unidad: getValue(parts, ['unidad', 'curso']) ?? '',
                sexo: getValue(parts, ['sexo']) ?? '',
                email_personal: getValue(parts, ['correo electrónico personal alumno/a', 'correo electronico personal alumno/a', 'correo']),
                primer_apellido: getValue(parts, ['primer apellido']),
                segundo_apellido: getValue(parts, ['segundo apellido']),
                nombre: getValue(parts, ['nombre']),
                tutor1_primer_apellido: getValue(parts, ['primer apellido primer tutor']),
                tutor1_segundo_apellido: getValue(parts, ['segundo apellido primer tutor']),
                tutor1_nombre: getValue(parts, ['nombre primer tutor']),
                tutor1_email: getValue(parts, ['correo electrónico primer tutor', 'correo electronico primer tutor']),
                tutor1_telefono: getValue(parts, ['teléfono primer tutor', 'telefono primer tutor']),
                tutor1_sexo: getValue(parts, ['sexo primer tutor']),
                tutor2_primer_apellido: getValue(parts, ['primer apellido segundo tutor']),
                tutor2_segundo_apellido: getValue(parts, ['segundo apellido segundo tutor']),
                tutor2_email: getValue(parts, ['correo electrónico segundo tutor', 'correo electronico segundo tutor']),
                tutor2_nombre: getValue(parts, ['nombre segundo tutor']),
                tutor2_sexo: getValue(parts, ['sexo segundo tutor']),
                tutor2_telefono: getValue(parts, ['teléfono segundo tutor', 'telefono segundo tutor']),
                edad_matricula: getValue(parts, ['edad a 31/12 del año de matrícula', 'edad a 31/12 del año de matricula']),
                fecha_matricula: getValue(parts, ['fecha de matrícula', 'fecha de matricula']),
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

            const result = await previewAlumnosUpdate(rows)
            setLoading(false)
            if (result.error) {
                toast.error(result.error)
                return
            }
            setToUpdate(result.toUpdate)
            setToInsert(result.toInsert)
            setStep('preview')
        }
        reader.readAsText(f)
    }

    const handleConfirmUpdates = async () => {
        if (toUpdate.length > 0) {
            setLoading(true)
            const result = await applyAlumnosUpdate(toUpdate)
            setLoading(false)
            if (result.error) { toast.error(result.error); return }
            toast.success(`${result.count} alumnos actualizados.`)
        }
        setStep('insert')
    }

    const handleConfirmInsert = async () => {
        if (toInsert.length > 0) {
            setLoading(true)
            const result = await insertNewAlumnos(toInsert)
            setLoading(false)
            if (result.error) { toast.error(result.error); return }
            toast.success(`${result.count} alumnos añadidos.`)
        }
        setDone(true)
    }

    const resetAll = () => {
        setStep('upload')
        setFile(null)
        setToUpdate([])
        setToInsert([])
        setCsvTotal(0)
        setDone(false)
    }

    const steps: Step[] = ['upload', 'preview', 'insert']
    const stepLabels = ['Subir archivo', 'Actualizar', 'Nuevos']

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
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="bg-primary-brand/10 p-3 rounded-xl text-primary-brand">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos registrados</p>
                                <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-xl text-green-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos activos</p>
                                <p className="text-2xl font-black text-slate-900">{activeCount}</p>
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
                                Sube el CSV exportado del sistema de gestión. Se ignorarán los alumnos con <strong>estado de matrícula</strong> no vacío (ej. Baja).
                                Los alumnos existentes se actualizarán y los nuevos se insertarán.
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
                                <p className="text-slate-400 text-sm mt-1">Formato CSV separado por tabulador, punto y coma o coma</p>
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
                        <div className={`bg-white rounded-2xl border p-5 ${toUpdate.length > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">A actualizar</p>
                            <p className="text-3xl font-black text-slate-900">{toUpdate.length}</p>
                            <p className="text-sm text-slate-500">alumnos</p>
                        </div>
                        <div className={`bg-white rounded-2xl border p-5 ${toInsert.length > 0 ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">A insertar</p>
                            <p className="text-3xl font-black text-slate-900">{toInsert.length}</p>
                            <p className="text-sm text-slate-500">nuevos</p>
                        </div>
                    </div>

                    {toUpdate.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Alumnos a actualizar</h3>
                                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">
                                    {toUpdate.length} registros
                                </span>
                            </div>
                            <div className="overflow-x-auto max-h-80">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left">Alumno</th>
                                            <th className="px-5 py-3 text-left">Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {toUpdate.map((u, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">{u.alumno}</td>
                                                <td className="px-5 py-2.5">
                                                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                                        {u.unidad || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">Todos los alumnos están actualizados. No hay cambios necesarios.</p>
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
                                : toUpdate.length > 0
                                    ? <><Save className="w-4 h-4" /> Confirmar {toUpdate.length} actualizaciones</>
                                    : <>Continuar →</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Insert new students ── */}
            {step === 'insert' && (
                <div className="space-y-5">
                    {toInsert.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between bg-green-50/50">
                                <h3 className="font-bold text-slate-900">Nuevos alumnos a insertar</h3>
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                                    {toInsert.length} registros
                                </span>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left">Alumno</th>
                                            <th className="px-5 py-3 text-left">Unidad</th>
                                            <th className="px-5 py-3 text-left">Sexo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {toInsert.map((a, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-2.5 font-medium text-slate-800">{a.alumno}</td>
                                                <td className="px-5 py-2.5">
                                                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                                                        {a.unidad || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 text-slate-500 text-xs">{a.sexo || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                            <p className="font-semibold text-slate-600">Todos los alumnos del CSV ya están en la base de datos.</p>
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
                                : toInsert.length > 0
                                    ? <><Save className="w-4 h-4" /> Confirmar {toInsert.length} inserciones</>
                                    : <>Finalizar</>
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
