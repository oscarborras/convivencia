import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log('DEBUG MIDDLEWARE:', { 
        path: request.nextUrl.pathname, 
        hasUser: !!user, 
        userId: user?.id 
    })

    const isLoginPath = request.nextUrl.pathname.startsWith('/login')
    const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
    const hasAuthCode = request.nextUrl.searchParams.has('code')

    // 1. Si no hay usuario, no es ruta pública y NO tiene código de auth -> login
    if (!user && !isLoginPath && !isAuthPath && !hasAuthCode) {
        console.log('DEBUG: No user found and no auth code, redirecting to login')
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }


    // 2. Si hay usuario, verificar rol excepto en rutas de autenticación del sistema
    if (user && !isAuthPath) {
        // Consultar el perfil del usuario utilizando la tabla user_roles y perfiles
        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('perfiles(nombre)')
            .eq('user_id', user.id)
            .single()

        const roleName = (roleData?.perfiles as any)?.nombre
        const isAuthorized = roleName === 'Directiva'

        console.log('DEBUG: Role check', { roleName, isAuthorized, roleError })

        // Caso: Intentando acceder al login estando ya autenticado
        if (isLoginPath) {
            if (isAuthorized) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
            // Si no está autorizado pero ya está en el login, dejarle para que vea el mensaje
            return supabaseResponse
        }

        // Caso: Protegiendo todas las demás rutas
        if (!isAuthorized) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('errorMessage', 'Tu cuenta de Google no tiene permisos de acceso. Contacta con el administrador.')

            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

