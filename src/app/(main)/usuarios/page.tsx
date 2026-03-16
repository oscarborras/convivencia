import { createClient } from '@/lib/supabase/server'
import { Shield, User, ShieldCheck, Info, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import UserRoleToggle from './components/UserRoleToggle'


interface UserWithRoles {
    id: string
    email: string
    full_name: string | null
    provider: string | null
    roles: number[]
}


export const dynamic = 'force-dynamic'

export const metadata = {

    title: 'Gestión de Usuarios - Convivencia',
    description: 'Administre los permisos y niveles de acceso de las cuentas registradas.',
}

export default async function UsuariosPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string, pageSize?: string, filter?: string }>
}) {
    const params = await searchParams
    const currentPage = Number(params.page) || 1
    const pageSize = Number(params.pageSize) || 5
    const currentFilter = params.filter || 'all'



    const supabase = await createClient()


    // 1. Obtener todos los perfiles disponibles
    const { data: perfiles } = await supabase
        .from('perfiles')
        .select('*')
        .order('id')

    // 2. Obtener todos los usuarios de la vista (que incluye email y metadata de Auth)
    const { data: usersData } = await supabase
        .from('users_view')
        .select('*')
        .order('email')

    // 3. Obtener todas las asignaciones de roles actuales
    const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, perfil_id')

    // 4. Mapear datos con conversión explícita a Number para evitar errores de tipo
    const allUsers: UserWithRoles[] = (usersData || []).map(u => {
        const userRolesIds = (userRoles || [])
            .filter(ur => ur.user_id === u.id)
            .map(ur => Number(ur.perfil_id)) // Forzar a número
        
        return {
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            provider: u.provider,
            roles: userRolesIds
        }
    })

    const googleUsersWithoutRole = allUsers.filter(u => u.provider === 'google' && u.roles.length === 0)

    // 5. Aplicar Filtro si existe
    const filteredUsers = currentFilter === 'no-access' 
        ? googleUsersWithoutRole
        : allUsers

    // 6. Lógica de paginación
    const totalUsers = filteredUsers.length
    const totalPages = Math.ceil(totalUsers / pageSize)
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)




    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Seguridad y Accesos</span>
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Administre los permisos y niveles de acceso de las cuentas registradas.
                    </p>
                </div>

                <div className="flex gap-3">
                    {googleUsersWithoutRole.length > 0 && (
                        <Link 
                            href={currentFilter === 'no-access' ? '/usuarios' : '/usuarios?filter=no-access'}
                            className={`bg-white px-4 py-2 rounded-2xl border-2 shadow-sm flex items-center gap-3 transition-all hover:scale-105 active:scale-95 ${
                                currentFilter === 'no-access' 
                                ? 'border-rose-500 bg-rose-50/30' 
                                : 'border-rose-100 animate-pulse'
                            }`}
                        >
                            <div className="bg-rose-50 p-2 rounded-xl">
                                <ShieldAlert className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900 leading-none">
                                    {googleUsersWithoutRole.length} sin acceso
                                </span>
                                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">
                                    {currentFilter === 'no-access' ? 'Filtrando...' : 'Pendiente Google'}
                                </span>
                            </div>
                        </Link>
                    )}

                    <Link 
                        href="/usuarios"
                        className={`bg-white px-4 py-2 rounded-2xl border shadow-sm flex items-center gap-3 transition-all hover:scale-105 active:scale-95 ${
                            currentFilter === 'all' 
                            ? 'border-blue-500 bg-blue-50/30' 
                            : 'border-gray-100'
                        }`}
                    >
                        <div className="bg-blue-50 p-2 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 leading-none">
                                {allUsers.length} usuarios registrados
                            </span>

                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Cuentas Activas
                            </span>
                        </div>
                    </Link>

                </div>

            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Info Panel */}
                <div className="p-8 pb-0">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 flex items-start gap-5">
                        <div className="bg-amber-100 p-4 rounded-2xl mt-1">
                            <Shield className="w-6 h-6 text-amber-600 fill-amber-600/10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900">Panel de Seguridad</h3>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                                Haga clic en los iconos para asignar o retirar perfiles. Los cambios se aplican de forma inmediata
                                y afectarán a la visibilidad de los módulos para el usuario seleccionado.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-x-auto">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 rounded-2xl">
                                <th className="text-left px-6 py-4 rounded-l-2xl">Usuario</th>
                                {perfiles?.map((perfil, idx) => (
                                    <th key={perfil.id} className={`text-center px-4 py-4 ${idx === perfiles.length - 1 ? 'rounded-r-2xl' : ''}`}>
                                        {perfil.nombre}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="group">

                                    {/* User Info Cell */}
                                    <td className="bg-slate-50/30 group-hover:bg-slate-50 rounded-l-[1.2rem] px-6 py-3 border-l border-t border-b border-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm leading-tight">
                                                    {user.email}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                    ID: {user.id.substring(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role Toggle Cells */}
                                    {perfiles?.map((perfil, idx) => (
                                        <td
                                            key={perfil.id}
                                            className={`
                                                bg-slate-50/30 group-hover:bg-slate-50 py-3 border-t border-b border-gray-100 transition-colors
                                                ${idx === perfiles.length - 1 ? 'rounded-r-[1.2rem] border-r' : ''}
                                            `}
                                        >
                                            <div className="flex justify-center items-center w-full">
                                                <UserRoleToggle
                                                    userId={user.id}
                                                    perfilId={perfil.id}
                                                    hasRole={user.roles.includes(perfil.id)}
                                                />
                                            </div>
                                        </td>
                                    ))}

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mostrar:</span>
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            {[5, 10, 20].map((size) => (
                                <Link
                                    key={size}
                                    href={`/usuarios?page=1&pageSize=${size}`}
                                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                        pageSize === size 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {size}
                                </Link>
                            ))}
                        </div>
                        <span className="text-xs font-medium text-slate-500 ml-2">
                            Mostrando <span className="font-bold text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, totalUsers)}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalUsers)}</span> de {totalUsers}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/usuarios?page=${Math.max(1, currentPage - 1)}&pageSize=${pageSize}`}
                            className={`p-2 rounded-xl border border-gray-200 bg-white text-slate-500 transition-all ${
                                currentPage === 1 ? 'opacity-40 pointer-events-none' : 'hover:border-blue-600 hover:text-blue-600 shadow-sm'
                            }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        
                        <div className="flex items-center px-4">
                            <span className="text-sm font-black text-slate-900 tracking-tight">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>

                        <Link
                            href={`/usuarios?page=${Math.min(totalPages, currentPage + 1)}&pageSize=${pageSize}`}
                            className={`p-2 rounded-xl border border-gray-200 bg-white text-slate-500 transition-all ${
                                currentPage === totalPages ? 'opacity-40 pointer-events-none' : 'hover:border-blue-600 hover:text-blue-600 shadow-sm'
                            }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}


function ShieldCheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
