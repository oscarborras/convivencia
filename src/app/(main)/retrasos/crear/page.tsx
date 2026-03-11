import { createClient } from '@/lib/supabase/server'
import { createRetraso } from './actions'
import { Clock, FileCheck, AlertTriangle, MessageSquare } from 'lucide-react'
import AlumnoSelector from '@/components/retrasos/AlumnoSelector'
import SubmitButton from '@/components/SubmitButton'

export default async function NuevoRetrasoPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    const { error } = await searchParams
    const supabase = await createClient()

    // Obtenemos los alumnos con sus campos reales y datos de tutores
    const { data: alumnosData } = await supabase
        .from('alumnos')
        .select(`
            id, alumno, unidad,
            tutor1_nombre, tutor1_primer_apellido, tutor1_segundo_apellido, tutor1_email,
            tutor2_nombre, tutor2_primer_apellido, tutor2_segundo_apellido, tutor2_email
        `)
        .order('alumno')

    const alumnos = (alumnosData || []).map(a => ({
        id: a.id,
        alumno: a.alumno,
        unidad: a.unidad,
        tutor1_nombre: a.tutor1_nombre,
        tutor1_primer_apellido: a.tutor1_primer_apellido,
        tutor1_segundo_apellido: a.tutor1_segundo_apellido,
        tutor1_email: a.tutor1_email,
        tutor2_nombre: a.tutor2_nombre,
        tutor2_primer_apellido: a.tutor2_primer_apellido,
        tutor2_segundo_apellido: a.tutor2_segundo_apellido,
        tutor2_email: a.tutor2_email
    }))

    return (
        <div className="max-w-3xl mx-auto">
            {/* Cabecera del Formulario */}
            <div className="bg-white rounded-3xl p-6 border-t-4 border-blue-600 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registro de Retraso</h1>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Al validar este formulario, se avisará a los tutores legales del/la alumno/a,
                        al tutor o tutora del curso, así como a jefatura de estudios.
                    </p>
                </div>
                {/* Elemento decorativo */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl" />
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm flex items-center gap-3" role="alert">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Error al guardar registro</p>
                        <p className="text-xs opacity-80">{error === 'true' ? 'Por favor, inténtalo de nuevo.' : error}</p>
                    </div>
                </div>
            )}

            <form action={createRetraso} className="mt-4 space-y-4">
                {/* Búsqueda de Alumno */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <AlumnoSelector alumnos={alumnos} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sección: Justificante */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                            <div className="bg-green-50 p-2 rounded-xl">
                                <FileCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="uppercase text-xs tracking-widest text-gray-400">¿Justificante?</span>
                        </div>
                        <div className="flex gap-3 mt-auto">
                            <label className="flex-1 relative">
                                <input type="radio" name="justificante" value="true" className="peer sr-only" required />
                                <div className="p-3 text-center bg-gray-50 border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-gray-100 transition-all font-bold text-sm">
                                    Sí
                                </div>
                            </label>
                            <label className="flex-1 relative">
                                <input type="radio" name="justificante" value="false" className="peer sr-only" />
                                <div className="p-3 text-center bg-gray-50 border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-gray-100 transition-all font-bold text-sm">
                                    No
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Sección: Sancionable */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                            <div className="bg-orange-50 p-2 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="uppercase text-xs tracking-widest text-gray-400">¿Sancionable?</span>
                        </div>
                        <div className="flex gap-3 mt-auto">
                            <label className="flex-1 relative">
                                <input type="radio" name="sancionable" value="true" className="peer sr-only" required />
                                <div className="p-3 text-center bg-gray-50 border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 hover:bg-gray-100 transition-all font-bold text-sm">
                                    Sí
                                </div>
                            </label>
                            <label className="flex-1 relative">
                                <input type="radio" name="sancionable" value="false" className="peer sr-only" />
                                <div className="p-3 text-center bg-gray-50 border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-gray-100 transition-all font-bold text-sm">
                                    No
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Sección: Observaciones */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                        <div className="bg-purple-50 p-2 rounded-xl">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="uppercase text-xs tracking-widest text-gray-400">Observaciones</span>
                    </div>
                    <textarea
                        id="observaciones"
                        name="observaciones"
                        rows={2}
                        placeholder="Detalles adicionales..."
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-inner text-sm"
                    ></textarea>
                </div>

                {/* Botón Envío */}
                <div className="flex gap-4 pt-2 pb-8">
                    <a
                        href="/dashboard"
                        className="flex-1 px-6 py-4 bg-white text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all text-center border-2 border-gray-100 shadow-sm text-sm flex items-center justify-center"
                    >
                        Cancelar
                    </a>
                    <SubmitButton
                        className="flex-[2] px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 text-base"
                    >
                        Confirmar Registro
                    </SubmitButton>
                </div>
            </form>
        </div>
    )
}
