import { createClient } from '@/lib/supabase/server'
import ImportClient from './ImportClient'

export const dynamic = 'force-dynamic'

export default async function ImportarProfesoresPage() {
    const supabase = await createClient()

    const { count } = await supabase
        .from('profesores')
        .select('*', { count: 'exact', head: true })

    const { data: lastProfesor } = await supabase
        .from('profesores')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Importar Profesores</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Añade rápidamente múltiples profesores a la base de datos mediante la carga de un archivo estructurado.
                </p>
            </div>

            <ImportClient initialCount={count || 0} lastUpdate={lastProfesor?.created_at || null} />

            {/* Help Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                        <span className="material-symbols-outlined shrink-0 text-xl font-bold">Info</span>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Cómo obtener el fichero CSV</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            1.- Desde Séneca ir a Personal → Personal del Centro.<br />
                            2.- Exportar datos como &quot;Hoja Microsoft Excel&quot;.<br />
                            3.- Abre el archivo xls con Libreoffice o Microsoft Excel y elimina las 4 primeras filas para que la primera sea la cabecera que indica que es cada columna.<br />
                            4.- Guarda el archivo como CSV, seleccionando codificación Unicode (UTF-8), delimitador de campo punto y coma (;) y delimitador de cadena comillas dobles (").<br />
                            5.- Sube el archivo CSV a la aplicación.
                        </p>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                        <span className="material-symbols-outlined shrink-0 text-xl font-bold">warning</span>
                    </div>
                    <div>
                        <h4 className="font-bold mb-1">Qué hace el sistema</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            1.- Actualiza los campos vacíos (puesto, fecha de alta, fecha de cese) de los profesores ya existentes, identificándolos por nombre. <br />
                            2.- Si un profesor aparece varias veces en el CSV y su contrato anterior ha caducado, se actualiza con el contrato más reciente. <br />
                            3.- Se insertan profesores nuevos.<br />
                            4.- Solicita emails de los profesores sin email.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
