import { createClient } from '@/lib/supabase/server'
import ClientNotificaciones from './ClientNotificaciones'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Notificaciones - Convivencia',
    description: 'Administre el envío de notificaciones a los tutores.',
}

export default async function NotificacionesPage() {
    const supabase = await createClient()

    // Fetch alumnos
    const { data: alumnos } = await supabase
        .from('alumnos')
        .select(`
            id,
            nombre,
            primer_apellido,
            segundo_apellido,
            tutor1_nombre,
            tutor1_primer_apellido,
            tutor1_segundo_apellido,
            tutor1_email,
            tutor1_telefono,
            tutor2_nombre,
            tutor2_primer_apellido,
            tutor2_segundo_apellido,
            tutor2_email,
            tutor2_telefono
        `)
        .order('primer_apellido')
        
    // Fetch notificaciones bloqueadas
    const { data: notificaciones } = await supabase
        .from('convi_notificaciones')
        .select('*')

    return (
        <ClientNotificaciones 
            alumnos={alumnos || []} 
            notificaciones={notificaciones || []} 
        />
    )
}
