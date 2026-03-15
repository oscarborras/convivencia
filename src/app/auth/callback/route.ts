import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Ruta de callback para OAuth - Supabase redirige aquí tras autenticación con Google
export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin).replace(/\/$/, '')

    if (code) {
        const response = NextResponse.redirect(`${siteUrl}${next}`)
        
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const cookieHeader = request.headers.get('Cookie') ?? ''
                        return cookieHeader.split(';').map(v => v.split('=')).reduce((acc, v) => {
                            if (v.length === 2) acc.push({ name: v[0].trim(), value: v[1].trim() })
                            return acc
                        }, [] as any[])
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('DEBUG CALLBACK: Session successfully established for:', data.user?.email)
            return response
        }
        
        console.error('DEBUG CALLBACK ERROR:', error)
    }

    return NextResponse.redirect(`${siteUrl}/login?errorMessage=Fallo%20de%20autenticaci%C3%B3n`)
}


