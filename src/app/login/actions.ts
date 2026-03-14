'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?errorMessage=No%20se%20ha%20podido%20iniciar%20sesi%C3%B3n.%20Revisa%20tus%20credenciales.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function loginWithGoogle() {
    const supabase = await createClient()

    // Usar la variable de entorno para construir la URL de callback de forma fiable
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${siteUrl}/auth/callback`,
        },
    })

    if (error) {
        redirect('/login?errorMessage=No%20se%20pudo%20iniciar%20sesi%C3%B3n%20con%20Google.')
    }

    if (data.url) {
        redirect(data.url)
    }
}
