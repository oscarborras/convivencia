import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function POST() {
    const supabase = await createClient()

    // Sign out the current user
    await supabase.auth.signOut()

    // Revalidate and redirect to login
    revalidatePath('/', 'layout')
    redirect('/login')
}
