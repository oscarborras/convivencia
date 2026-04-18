import { Users, Upload, Briefcase, FileSpreadsheet, Database, ArrowUpFromLine } from 'lucide-react'
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
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Grid de opciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Profesores */}
                <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-orange-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Profesores</h2>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                        Actualiza el listado de profesores. El sistema procesará el archivo para registrar los nuevos docentes.
                    </p>
                    <div className="flex gap-2">
                        <Link href="/importar/profesores"
                            className="flex-1 flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <ArrowUpFromLine className="w-4 h-4" />
                            Importar
                        </Link>
                        <Link href="/importar/profesores/listado"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <Database className="w-4 h-4" />
                            Consultar
                        </Link>
                    </div>
                </div>

                {/* Alumnos */}
                <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-blue-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Alumnos</h2>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                        Actualiza el listado completo de alumnos. El sistema procesará el archivo para crear o actualizar sus registros.
                    </p>
                    <div className="flex gap-2">
                        <Link href="/importar/alumnos"
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <ArrowUpFromLine className="w-4 h-4" />
                            Importar
                        </Link>
                        <Link href="/importar/alumnos/listado"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <Database className="w-4 h-4" />
                            Consultar
                        </Link>
                    </div>
                </div>

                {/* Tutores */}
                <div className="bg-white rounded-3xl p-6 border-2 border-transparent shadow-sm hover:border-purple-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
                            <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Tutores</h2>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                        Actualiza el listado de tutores. Asigna a cada grupo el correo electrónico de su respectivo tutor/a.
                    </p>
                    <div className="flex gap-2">
                        <Link href="/importar/tutores"
                            className="flex-1 flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <ArrowUpFromLine className="w-4 h-4" />
                            Importar
                        </Link>
                        <Link href="/importar/tutores/listado"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                            <Database className="w-4 h-4" />
                            Consultar
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    )
}
