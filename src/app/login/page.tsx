import { login, loginWithGoogle } from './actions'
import { GraduationCap, Mail, Lock, ChevronRight } from 'lucide-react'

// Icono SVG de Google (no disponible en Lucide)
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}

export default async function LoginPage({
    searchParams,
}: {
    searchParams: { errorMessage?: string }
}) {
    const { errorMessage } = await searchParams

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700" />

            <div className="container max-w-6xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white m-4 min-h-[600px]">

                {/* Visual Section - Left Side on Desktop */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white flex-col justify-between relative">
                    <div className="relative z-10">
                        <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-lg">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
                            I.E.S. Julio Verne
                        </h1>
                        <p className="text-blue-100 text-lg lg:text-xl font-medium max-w-md leading-relaxed">
                            Panel centralizado para la gestión eficiente de convivencia, partes y asistencia escolar.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-blue-300 animate-ping" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Sistema Activo</span>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Shapes */}
                    <div className="absolute top-20 right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-10 left-[-20px] w-40 h-40 bg-indigo-400/20 rounded-full blur-xl" />
                </div>

                {/* Form Section - Right Side */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
                    <div className="mb-10 text-center md:text-left">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex justify-center mb-6">
                            <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <GraduationCap className="w-8 h-8" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
                        <p className="text-gray-500 font-medium">Introduce tus credenciales para acceder</p>
                    </div>

                    {/* Botón de login con Google */}
                    <form action={loginWithGoogle} className="mb-6">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all shadow-sm"
                        >
                            <GoogleIcon />
                            Continuar con Google
                        </button>
                    </form>

                    {/* Divisor */}
                    <div className="relative flex items-center mb-6">
                        <div className="flex-grow border-t border-gray-100" />
                        <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            o con correo
                        </span>
                        <div className="flex-grow border-t border-gray-100" />
                    </div>

                    <form action={login} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" strokeWidth={2.5} />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all outline-none font-medium"
                                    placeholder="ejemplo@iesjulioverne.es"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label htmlFor="password" className="text-sm font-bold text-gray-700">
                                    Contraseña
                                </label>
                                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 tracking-tight">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" strokeWidth={2.5} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all outline-none font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 animate-head-shake" role="alert">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-blue-500/20 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all font-sans"
                        >
                            Acceder al Sistema
                            <ChevronRight className="w-5 h-5" strokeWidth={3} />
                        </button>
                    </form>

                    <div className="mt-10 text-center md:text-left flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm font-semibold text-gray-400">
                        <p className="mr-auto text-xs uppercase tracking-widest font-bold">&copy; 2026 - IES Julio Verne</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-gray-600 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-gray-600 transition-colors">Soporte</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
