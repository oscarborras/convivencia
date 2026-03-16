'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleUserRole(userId: string, perfilId: number, hasRole: boolean) {
    const supabase = await createClient()

    if (hasRole) {
        // Remove role
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('perfil_id', perfilId)
        
        if (error) throw new Error(error.message)
    } else {
        // Add role
        const { error } = await supabase
            .from('user_roles')
            .insert({
                user_id: userId,
                perfil_id: perfilId
            })
        
        if (error) throw new Error(error.message)
    }

    revalidatePath('/usuarios')
}
