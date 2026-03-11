import { createClient } from '@/lib/supabase/server'
import ImportTutoresClient from './ImportTutoresClient'
import { Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ImportarTutoresPage() {
    const supabase = await createClient()

    // Cursos que ya tienen un tutor
    const { count } = await supabase
        .from('cursos')
        .select('*', { count: 'exact', head: true })
        .not('email_tutor', 'is', null)

    const { data: lastCourse } = await supabase
        .from('cursos')
        .select('updated_at')
        .not('updated_at', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Importar Tutores</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Añade o actualiza masivamente los correos electrónicos de los tutores asignados a cada unidad/curso mediante archivo estructurado CSV.
                </p>
            </div>

            <ImportTutoresClient initialCount={count || 0} lastUpdate={lastCourse?.updated_at || null} />

            {/* Empty State Help Card */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                        <span className="material-symbols-outlined shrink-0 text-xl font-bold">Info</span>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Instrucciones fichero CSV</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            1.- Prepara el listado de tutores en un documento Excel.
                            <br />2.- Deja solo las columnas "Curso" y "Correo" (en este orden específico). Elimina encabezados si es necesario.
                            <br />3.- Asegúrate de que los emails sean válidos.
                            <br />4.- Guarda como CSV separado por comas o punto y coma y súbelo.
                        </p>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                        <span className="material-symbols-outlined shrink-0 text-xl font-bold">warning</span>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Cursos Existentes</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            Este fichero cruzará el nombre de los cursos existentes en base de datos. Si introduces un curso que aún no existe, el sistema lo creará automáticamente con su email de tutor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
