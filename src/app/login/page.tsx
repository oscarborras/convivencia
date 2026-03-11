import { login } from './actions'
import { GraduationCap, Mail, Lock, ChevronRight } from 'lucide-react'

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

                    <div className="mt-12 text-center md:text-left flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm font-semibold text-gray-400">
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
