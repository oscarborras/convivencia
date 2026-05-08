import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    // Detrás de un reverse proxy, request.url puede llevar el host interno.
    // Se reconstruye el origin a partir de las cabeceras de forwarding si están presentes.
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? requestUrl.protocol.replace(':', '')
    const host  = request.headers.get('x-forwarded-host')?.split(',')[0].trim() ?? requestUrl.host
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? `${proto}://${host}`
    const siteUrl = origin

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

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }
    }

    return NextResponse.redirect(`${siteUrl}/login?errorMessage=Fallo%20de%20autenticaci%C3%B3n`)
}



