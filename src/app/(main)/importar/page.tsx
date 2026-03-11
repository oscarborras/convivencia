import { Users, Upload, ChevronRight, FileSpreadsheet, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function ImportarPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Cabecera */}
            <div className="bg-white rounded-3xl p-8 border-t-4 border-emerald-500 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                                <Upload className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importación de Datos</h1>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                            Desde este panel puedes realizar la carga masiva de datos en el sistema.
                            Selecciona la categoría que deseas actualizar usando el módulo correspondiente.
                        </p>
                    </div>
                </div>
                {/* Decoración */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Grid de opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Tarjeta de Importar Profesores */}
                <Link href="/importar/profesores" className="group">
                    <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-emerald-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 mt-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Profesores</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                Actualiza el listado de profesores. El sistema procesará el archivo para registrar los nuevos docentes.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50/80 px-3 py-2 rounded-xl w-fit">
                            <FileSpreadsheet className="w-4 h-4" />
                            CSVs válidos
                        </div>
                    </div>
                </Link>

                {/* Tarjeta de Importar Alumnos */}
                <Link href="/importar/alumnos" className="group">
                    <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-emerald-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 mt-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Alumnos</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                Actualiza el listado completo de alumnos. El sistema procesará el archivo para crear o actualizar sus registros.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50/80 px-3 py-2 rounded-xl w-fit">
                            <FileSpreadsheet className="w-4 h-4" />
                            CSVs válidos
                        </div>
                    </div>
                </Link>

                {/* Tarjeta de Importar Tutores */}
                <Link href="/importar/tutores" className="group">
                    <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-emerald-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <FileSpreadsheet className="w-8 h-8" />
                            </div>
                            <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 mt-auto">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Tutores</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                Actualiza el listado de tutores. Asigna a cada grupo el correo electrónico de su respectivo tutor/a.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50/80 px-3 py-2 rounded-xl w-fit">
                            <FileSpreadsheet className="w-4 h-4" />
                            CSVs válidos
                        </div>
                    </div>
                </Link>

            </div>
        </div>
    )
}
