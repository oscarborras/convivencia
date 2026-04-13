import { createClient } from '@/lib/supabase/server'
import { createParte } from './actions'
import { FileText, AlertTriangle, MessageSquare, Calendar, ShieldAlert, AlertOctagon } from 'lucide-react'
import AlumnoSelector from '@/components/retrasos/AlumnoSelector'
import SubmitButton from '@/components/SubmitButton'

const OPT_HORAS = ['1ª', '2ª', '3ª', 'Recreo', '4ª', '5ª', '6ª']

export default async function NuevoPartePage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    const { error } = await searchParams
    const supabase = await createClient()

    // Intentamos obtener alumnos (id, alumno, curso) y profesores (id, profesor)
    // Si falla (por diferencias de esquema), mostraremos listas vacías
    const today = new Date().toISOString().split('T')[0]
    const { data: alumnosData } = await supabase
        .from('alumnos')
        .select(`
            id, alumno, unidad,
            tutor1_nombre, tutor1_primer_apellido, tutor1_segundo_apellido, tutor1_email,
            tutor2_nombre, tutor2_primer_apellido, tutor2_segundo_apellido, tutor2_email
        `)
        .order('alumno')
    const { data: profesoresData } = await supabase
        .from('profesores')
        .select('id, profesor')
        .or(`fecha_cese.is.null,fecha_cese.gte.${today}`)
        .order('profesor')

    const { data: contrariasData } = await supabase
        .from('convi_opt_contrarias')
        .select('conducta')
        .eq('activa', true)
        .order('orden')

    const { data: gravesData } = await supabase
        .from('convi_opt_graves')
        .select('conducta')
        .eq('activa', true)
        .order('orden')

    const OPT_CONTRARIAS = (contrariasData || []).map(c => c.conducta)
    const OPT_GRAVES = (gravesData || []).map(c => c.conducta)

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
    const profesores = profesoresData || []

    return (
        <div className="max-w-3xl mx-auto">
            {/* Cabecera del Formulario */}
            <div className="bg-white rounded-3xl p-6 border-t-4 border-red-600 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-50 p-2 rounded-xl text-red-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registro de Parte</h1>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Completa el siguiente formulario para registrar una amonestación u ocurrencia disciplinaria.
                        Los tutores serán notificados automáticamente.
                    </p>
                </div>
                {/* Elemento decorativo */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-50/50 rounded-full blur-3xl" />
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm flex items-center gap-3" role="alert">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Error al guardar registro</p>
                        <p className="text-xs opacity-80">Por favor, verifica los datos o inténtalo de nuevo.</p>
                    </div>
                </div>
            )}

            <form action={createParte} className="mt-4 space-y-4">
                {/* Búsqueda de Alumno */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <AlumnoSelector alumnos={alumnos} />
                </div>

                {/* SECCIÓN 1: DATOS BÁSICOS */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-2">
                        <div className="bg-blue-50 p-2 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="uppercase text-xs tracking-widest text-gray-400">Datos Generales</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase tracking-wider">Fecha</label>
                            <input
                                type="date"
                                name="fecha"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1 ml-1 uppercase tracking-wider">
                                Hora <span className="normal-case font-normal text-gray-400">(Opcional)</span>
                            </label>
                            <select
                                name="hora"
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner text-sm font-medium"
                            >
                                <option value="">Sin especificar</option>
                                {OPT_HORAS.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-1 ml-1 uppercase tracking-wider">
                            Profesor/a -
                            {profesores.length > 0 && (
                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[10px]">{profesores.length} activos</span>
                            )}
                        </label>
                        <select
                            name="profesor_id"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner text-sm font-medium"
                        >
                            <option value="">Seleccionar Profesor...</option>
                            {profesores.map(p => (
                                <option key={p.id} value={p.id}>{p.profesor}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SECCIÓN 2: CONDUCTAS CONTRARIAS */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                        <div className="bg-orange-50 p-2 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="uppercase text-xs tracking-widest text-gray-400">Conductas Contrarias a la Convivencia</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr">
                        {OPT_CONTRARIAS.map((cond, idx) => (
                            <label key={`cond-${idx}`} className="h-full flex items-start gap-3 p-3 bg-gray-50 border-2 border-transparent rounded-2xl cursor-pointer transition-all has-[:checked]:bg-orange-50 has-[:checked]:border-orange-200">
                                <input type="checkbox" name="conductas_contrarias" value={cond} className="flex-shrink-0 mt-0.5 w-4 h-4 text-orange-600 rounded-md border-gray-300 focus:ring-orange-500 bg-white" />
                                <span className="text-sm font-medium text-gray-700 leading-tight">{cond}</span>
                            </label>
                        ))}
                    </div>
                    <div className="group mt-3 flex items-start gap-3 p-3 bg-gray-50 border-2 border-transparent rounded-2xl transition-all has-[:checked]:bg-orange-50 has-[:checked]:border-orange-200">
                        <input type="checkbox" id="otros_c" name="conductas_contrarias_otros_check" value="true" className="peer flex-shrink-0 mt-0.5 w-4 h-4 text-orange-600 rounded-md border-gray-300 focus:ring-orange-500 bg-white cursor-pointer" />
                        <div className="flex-1 flex flex-col">
                            <label htmlFor="otros_c" className="text-sm font-medium text-gray-700 cursor-pointer leading-tight w-full">Otra conducta contraria (especificar)</label>
                            <div className="mt-3 hidden group-has-[:checked]:block grow">
                                <input type="text" name="conductas_contrarias_otros_text" placeholder="Describe aquí la otra conducta..." className="w-full px-4 py-2 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: CONDUCTAS GRAVES */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-4">
                        <div className="bg-red-50 p-2 rounded-xl">
                            <AlertOctagon className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="uppercase text-xs tracking-widest text-gray-400">Conductas Gravemente Perjudiciales</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-fr">
                        {OPT_GRAVES.map((cond, idx) => (
                            <label key={`grav-${idx}`} className="h-full flex items-start gap-3 p-3 bg-gray-50 border-2 border-transparent rounded-2xl cursor-pointer transition-all has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                                <input type="checkbox" name="conductas_graves" value={cond} className="flex-shrink-0 mt-0.5 w-4 h-4 text-red-600 rounded-md border-gray-300 focus:ring-red-500 bg-white" />
                                <span className="text-sm font-medium text-gray-700 leading-tight">{cond}</span>
                            </label>
                        ))}
                    </div>
                    <div className="group mt-3 flex items-start gap-3 p-3 bg-gray-50 border-2 border-transparent rounded-2xl transition-all has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                        <input type="checkbox" id="otros_g" name="conductas_graves_otros_check" value="true" className="peer flex-shrink-0 mt-0.5 w-4 h-4 text-red-600 rounded-md border-gray-300 focus:ring-red-500 bg-white cursor-pointer" />
                        <div className="flex-1 flex flex-col">
                            <label htmlFor="otros_g" className="text-sm font-medium text-gray-700 cursor-pointer leading-tight w-full">Otra conducta gravemente perjudicial (especificar)</label>
                            <div className="mt-3 hidden group-has-[:checked]:block grow">
                                <input type="text" name="conductas_graves_otros_text" placeholder="Describe aquí la otra conducta..." className="w-full px-4 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 4: FINAL */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-2">
                        <div className="bg-purple-50 p-2 rounded-xl">
                            <ShieldAlert className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="uppercase text-xs tracking-widest text-gray-400">Resolución y Observaciones</span>
                    </div>

                    <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                        <span className="block text-sm font-bold text-orange-900 mb-3">¿Genera expulsión del aula?</span>
                        <div className="flex gap-4">
                            <label className="flex-1 relative">
                                <input type="radio" name="genera_expulsion" value="true" required className="peer sr-only" />
                                <div className="p-3 text-center bg-white border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-sky-500 peer-checked:border-sky-600 peer-checked:text-white hover:bg-orange-100 transition-all font-bold text-sm text-orange-700">
                                    Sí
                                </div>
                            </label>
                            <label className="flex-1 relative">
                                <input type="radio" name="genera_expulsion" value="false" required className="peer sr-only" />
                                <div className="p-3 text-center bg-white border-2 border-transparent rounded-xl cursor-pointer peer-checked:bg-sky-500 peer-checked:border-sky-600 peer-checked:text-white hover:bg-orange-100 transition-all font-bold text-sm text-orange-700">
                                    No
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-2 text-gray-800 font-bold mb-1">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="uppercase text-xs tracking-widest text-gray-400">Observaciones</span>
                        </label>
                        <textarea
                            name="observaciones"
                            rows={3}
                            placeholder="Añade detalles adicionales si es necesario..."
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner text-sm resize-none"
                        ></textarea>
                    </div>
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
                        className="flex-[2] px-6 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 active:translate-y-0 text-base flex-shrink-0"
                    >
                        Confirmar Registro
                    </SubmitButton>
                </div>
            </form>
        </div>
    )
}
