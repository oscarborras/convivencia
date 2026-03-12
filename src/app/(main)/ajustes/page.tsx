'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Save, Calendar, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AjustesPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        trimestre1_inicio: '',
        trimestre1_fin: '',
        trimestre2_inicio: '',
        trimestre2_fin: '',
        trimestre3_inicio: '',
        trimestre3_fin: '',
        email_convivencia: ''
    })

    const supabase = createClient()

    useEffect(() => {
        fetchConfig()
    }, [])

    async function fetchConfig() {
        try {
            const { data, error } = await supabase
                .from('convi_config')
                .select('*')
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    // No data found, handle it quietly as we will upsert on save
                } else {
                    throw error
                }
            }

            if (data) {
                setConfig({
                    trimestre1_inicio: data.trimestre1_inicio || '',
                    trimestre1_fin: data.trimestre1_fin || '',
                    trimestre2_inicio: data.trimestre2_inicio || '',
                    trimestre2_fin: data.trimestre2_fin || '',
                    trimestre3_inicio: data.trimestre3_inicio || '',
                    trimestre3_fin: data.trimestre3_fin || '',
                    email_convivencia: data.email_convivencia || ''
                })
            }
        } catch (error) {
            console.error('Error fetching config:', error)
            toast.error('Error al cargar la configuración')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            // Convertir strings vacíos a null para que Postgres los acepte como fechas
            const dataToSave = {
                id: 1,
                trimestre1_inicio: config.trimestre1_inicio || null,
                trimestre1_fin: config.trimestre1_fin || null,
                trimestre2_inicio: config.trimestre2_inicio || null,
                trimestre2_fin: config.trimestre2_fin || null,
                trimestre3_inicio: config.trimestre3_inicio || null,
                trimestre3_fin: config.trimestre3_fin || null,
                email_convivencia: config.email_convivencia || null
            }

            const { error } = await supabase
                .from('convi_config')
                .upsert(dataToSave)

            if (error) throw error
            toast.success('Configuración actualizada correctamente')
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="bg-white rounded-3xl p-8 border-t-4 border-blue-500 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                                <Settings className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ajustes del Sistema</h1>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                            Configura los parámetros globales de la aplicación, como los periodos lectivos y correos de contacto.
                        </p>
                    </div>
                </div>
                {/* Decoración */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Trimestres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 hover:border-blue-100 transition-colors">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <h2 className="font-bold text-gray-900">{num}º Trimestre</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                                        Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={config[`trimestre${num}_inicio` as keyof typeof config]}
                                        onChange={(e) => setConfig({ ...config, [`trimestre${num}_inicio`]: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl px-4 py-2.5 transition-all text-gray-700 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                                        Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={config[`trimestre${num}_fin` as keyof typeof config]}
                                        onChange={(e) => setConfig({ ...config, [`trimestre${num}_fin`]: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl px-4 py-2.5 transition-all text-gray-700 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Email de Convivencia */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 hover:border-teal-100 transition-colors">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-gray-900">Comunicación</h2>
                    </div>
                    
                    <div className="max-w-md">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                            Email de Convivencia
                        </label>
                        <input
                            type="email"
                            placeholder="ejemplo@centro.es"
                            value={config.email_convivencia}
                            onChange={(e) => setConfig({ ...config, email_convivencia: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 rounded-2xl px-4 py-2.5 transition-all text-gray-700 outline-none"
                        />
                        <p className="mt-3 text-sm text-gray-500 px-1 leading-relaxed">
                            Este correo electrónico será el remitente predeterminado para las notificaciones enviadas a las familias y profesorado.
                        </p>
                    </div>
                </div>

                {/* Botón Guardar */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    )
}
