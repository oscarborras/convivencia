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

    const isLoginPath = request.nextUrl.pathname.startsWith('/login')
    const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
    const hasAuthCode = request.nextUrl.searchParams.has('code')

    // 1. Si detectamos un código de auth y estamos en el callback, dejamos pasar al Route Handler
    if (hasAuthCode && isAuthPath) {
        return supabaseResponse
    }

    // 2. Redirigir al login si no hay sesión y se intenta acceder a una ruta protegida
    if (!user && !isLoginPath && !isAuthPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 3. Si hay sesión, verificar rol y redirecciones inteligentes
    if (user && !isAuthPath) {
        // Consultar los perfiles del usuario
        const { data: rolesData, error: roleError } = await supabase
            .from('user_roles')
            .select('perfil_id, perfiles(nombre)')
            .eq('user_id', user.id)

        const roles = rolesData || []
        const isAuthorized = roles.some(r => 
            r.perfil_id === 1 || 
            (r.perfiles as any)?.nombre === 'Admin' || 
            (r.perfiles as any)?.nombre === 'Directiva'
        )

        console.log('DEBUG: Role check', { roles, isAuthorized, roleError })


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

