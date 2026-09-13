'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

interface ResetHistorialResult {
    partesBorrados: number
    retrasosBorrados: number
}

export async function getHistorialCounts() {
    const supabase = await createClient()

    const [{ count: partes }, { count: retrasos }] = await Promise.all([
        supabase.from('convi_partes').select('*', { count: 'exact', head: true }),
        supabase.from('convi_retrasos').select('*', { count: 'exact', head: true }),
    ])

    return { partes: partes || 0, retrasos: retrasos || 0 }
}

export async function resetHistorialConvivencia(): Promise<ResetHistorialResult> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('reset_historial_convivencia')
    if (error) throw new Error(error.message)

    const result = Array.isArray(data) ? data[0] : data
    const partesBorrados = Number(result?.partes_borrados ?? 0)
    const retrasosBorrados = Number(result?.retrasos_borrados ?? 0)

    // Notificación por email (best-effort: no debe hacer fallar el borrado si el envío falla)
    try {
        const [{ data: config }, { data: { user } }] = await Promise.all([
            supabase.from('convi_config').select('email_convivencia, email_provider_partes').single(),
            supabase.auth.getUser(),
        ])

        if (config?.email_convivencia) {
            await sendEmail({
                to: config.email_convivencia,
                subject: 'Histórico de convivencia reiniciado',
                textBody: [
                    'Se ha borrado el histórico de convivencia desde Ajustes del Sistema.',
                    '',
                    `Partes borrados: ${partesBorrados}`,
                    `Retrasos borrados: ${retrasosBorrados}`,
                    `Realizado por: ${user?.email || 'desconocido'}`,
                    `Fecha: ${new Date().toLocaleString('es-ES')}`,
                ].join('\n'),
                provider: (config.email_provider_partes as 'resend' | 'mailtrap') || 'resend',
            })
        }
    } catch (emailError) {
        console.error('No se pudo enviar el email de notificación de borrado de histórico:', emailError)
    }

    revalidatePath('/ajustes')
    revalidatePath('/dashboard')
    revalidatePath('/partes')
    revalidatePath('/retrasos')
    revalidatePath('/informes')

    return { partesBorrados, retrasosBorrados }
}
