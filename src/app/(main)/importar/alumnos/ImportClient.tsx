'use client'

import { useState } from 'react'
import { UploadCloud, CheckCircle, Save, Table, Info, AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'
import { insertAlumnos } from './actions'

type ParsedRow = {
    alumno: string;
    unidad: string;
    sexo: string;
    estado_matricula?: string;
    email_personal?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    nombre?: string;
    tutor1_primer_apellido?: string;
    tutor1_segundo_apellido?: string;
    tutor1_nombre?: string;
    tutor1_email?: string;
    tutor1_telefono?: string;
    tutor1_sexo?: string;
    tutor2_primer_apellido?: string;
    tutor2_segundo_apellido?: string;
    tutor2_email?: string;
    tutor2_nombre?: string;
    tutor2_sexo?: string;
    tutor2_telefono?: string;
    edad_matricula?: string;
    fecha_matricula?: string;
    valido: boolean;
    error?: string;
}

export default function ImportClient({ initialCount, lastUpdate }: { initialCount: number; lastUpdate: string | null }) {
    const [file, setFile] = useState<File | null>(null)
    const [rows, setRows] = useState<ParsedRow[]>([])
    const [loading, setLoading] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0]
        if (!uploadedFile) return

        setFile(uploadedFile)

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            // Procesamiento CSV Básico
            const lines = text.split('\n').filter(line => line.trim() !== '')

            const parsedRows: ParsedRow[] = []

            const headerLine = lines[0]
            const separator = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ','

            const parseCSVLine = (text: string, sep: string) => {
                const result = [];
                let inQuotes = false;
                let current = '';
                for (let c = 0; c < text.length; c++) {
                    const char = text[c];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === sep && !inQuotes) {
                        result.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current);
                return result.map(p => p.trim());
            }

            const headers = parseCSVLine(headerLine, separator)

            // Normalize header names: remove quotes, remove accents, lowercase, trim
            const normalize = (s: string) => {
                return s.replace(/^["']|["']$/g, '')
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .trim()
            }
            const headerIndex = new Map<string, number>()
            headers.forEach((h, idx) => {
                headerIndex.set(normalize(h), idx)
            })

            // Verificar columnas mínimas requeridas. Acepta si tiene alumno/a o nombre
            if (!headerIndex.has('alumno/a') && !headerIndex.has('nombre') && !headerIndex.has('alumno')) {
                toast.error('No se encontró la columna "Alumno/a" o "Nombre" en el fichero CSV')
                return
            }

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                const parts = parseCSVLine(line, separator)

                const getValue = (keys: string[]) => {
                    for (const key of keys) {
                        const idx = headerIndex.get(normalize(key))
                        if (idx !== undefined && parts[idx] !== undefined) {
                            return parts[idx].replace(/^["']|["']$/g, '').trim();
                        }
                    }
                    return undefined;
                }

                const alumno = getValue(['alumno/a', 'alumno']) || getValue(['nombre']) || 'Desconocido'
                const unidad = getValue(['unidad', 'curso']) || ''
                const sexo = getValue(['sexo']) || ''

                const estadoMatricula = getValue(['estado matrícula', 'estado matricula']);

                if (alumno !== 'Desconocido') {
                    if (estadoMatricula && estadoMatricula.trim() !== '') {
                        // El estudiante se ignora por tener estado de matrícula no vacío (ej. Baja)
                        parsedRows.push({
                            alumno,
                            unidad,
                            sexo,
                            valido: false,
                            error: `Omitido: Estado matrícula no vacío (${estadoMatricula})`
                        });
                    } else {
                        parsedRows.push({
                            alumno,
                            unidad,
                            sexo,
                            estado_matricula: estadoMatricula,
                            email_personal: getValue(['correo electrónico personal alumno/a', 'correo electronico personal alumno/a', 'correo']),
                            primer_apellido: getValue(['primer apellido']),
                            segundo_apellido: getValue(['segundo apellido']),
                            nombre: getValue(['nombre']),
                            tutor1_primer_apellido: getValue(['primer apellido primer tutor']),
                            tutor1_segundo_apellido: getValue(['segundo apellido primer tutor']),
                            tutor1_nombre: getValue(['nombre primer tutor']),
                            tutor1_email: getValue(['correo electrónico primer tutor', 'correo electronico primer tutor']),
                            tutor1_telefono: getValue(['teléfono primer tutor', 'telefono primer tutor']),
                            tutor1_sexo: getValue(['sexo primer tutor']),
                            tutor2_primer_apellido: getValue(['primer apellido segundo tutor']),
                            tutor2_segundo_apellido: getValue(['segundo apellido segundo tutor']),
                            tutor2_email: getValue(['correo electrónico segundo tutor', 'correo electronico segundo tutor']),
                            tutor2_nombre: getValue(['nombre segundo tutor', 'nombre segundo tutor\t', 'nombre segundo tutor    ']),
                            tutor2_sexo: getValue(['sexo segundo tutor']),
                            tutor2_telefono: getValue(['teléfono segundo tutor', 'telefono segundo tutor']),
                            edad_matricula: getValue(['edad a 31/12 del año de matrícula', 'edad a 31/12 del año de matricula']),
                            fecha_matricula: getValue(['fecha de matrícula', 'fecha de matricula']),
                            valido: true
                        });
                    }
                } else {
                    parsedRows.push({
                        alumno: 'Línea vacía o error',
                        unidad: '-',
                        sexo: '-',
                        valido: false,
                        error: 'No se pudo leer el nombre de alumno'
                    })
                }
            }

            setRows(parsedRows)
        }
        reader.readAsText(uploadedFile)
    }

    const handleImport = async () => {
        const validRows = rows.filter(r => r.valido)
        if (validRows.length === 0) {
            toast.error('No hay registros válidos para importar.')
            return
        }

        setLoading(true)

        // Preparar el payload enviando solo datos válidos
        const payload = validRows.map(r => ({ ...r }))

        const result = await insertAlumnos(payload)

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${result.count} alumnos importados correctamente.`)
            setRows([])
            setFile(null)
        }
    }

    return (
        <div className="space-y-8">
            {/* Upload Zone */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 p-4 rounded-lg bg-primary-brand/5 border border-primary-brand/20 flex gap-4 items-start">
                        <Info className="w-5 h-5 text-primary-brand shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-primary-brand">Formato de archivo requerido</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Sube un archivo <strong className="font-semibold">CSV</strong>, como se indica en las instrucciones más abajo.
                                <br /><br />
                                <strong className="font-semibold">Se sincronizarán los datos para alumnos y actualizarán los campos que falten.</strong>
                            </p>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Table className="w-6 h-6 text-primary-brand" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estado actual</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{initialCount}</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-primary-brand uppercase tracking-widest bg-primary-brand/10 px-3 py-1 rounded-full">
                                Alumnos registrados
                            </span>
                            {lastUpdate && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                    Última actualización: <span className="text-slate-700 dark:text-slate-200">{new Date(lastUpdate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-12 text-center hover:border-primary-brand dark:hover:border-primary-brand transition-colors group cursor-pointer">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-brand/10 group-hover:text-primary-brand transition-all mb-4">
                                <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {file ? file.name : 'Arrastra tu archivo aquí'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'o haz click para buscar en tu equipo'}
                            </p>

                            {!file && (
                                <button type="button" className="bg-primary-brand hover:bg-primary-light text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-primary-brand/20 transition-all flex items-center gap-2 mx-auto">
                                    Seleccionar Archivo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Table Section */}
            {rows.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Table className="w-5 h-5 text-primary-brand" />
                            Vista previa de importación
                        </h2>
                        <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800">
                            {rows.filter(r => r.valido).length} válidos detectados
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left relative">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/90 backdrop-blur text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold text-left">Alumno</th>
                                    <th className="px-6 py-4 font-semibold text-left">Unidad</th>
                                    <th className="px-6 py-4 font-semibold text-left">Sexo</th>
                                    <th className="px-6 py-4 font-semibold text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.alumno}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                                {row.unidad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded font-medium ${row.sexo.toLowerCase().startsWith('h') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                                row.sexo.toLowerCase().startsWith('m') || row.sexo.toLowerCase().startsWith('f') ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {row.sexo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {row.valido ? (
                                                <span className="flex items-center justify-end gap-1 text-green-600 dark:text-green-500 font-medium whitespace-nowrap">
                                                    <CheckCircle className="w-4 h-4" /> Válido
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-500 font-medium whitespace-nowrap">
                                                    <AlertOctagon className="w-4 h-4" /> {row.error}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center gap-4">
                        <button
                            onClick={() => { setRows([]); setFile(null) }}
                            disabled={loading}
                            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || rows.filter(r => r.valido).length === 0}
                            className="bg-primary-brand hover:bg-primary-light text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-primary-brand/25 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Importando...' : 'Confirmar Importación'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
