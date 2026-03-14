import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ruta de callback para OAuth - Supabase redirige aquí tras autenticación con Google
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // 'next' permite redirigir al destino deseado tras el login
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // En caso de error, redirigir al login con mensaje de error
    return NextResponse.redirect(
        `${origin}/login?errorMessage=No%20se%20pudo%20autenticar%20con%20Google.%20Int%C3%A9ntalo%20de%20nuevo.`
    )
}
