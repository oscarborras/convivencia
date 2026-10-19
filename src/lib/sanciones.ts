// Tipos de sanción (valores de convi_sanciones.tipo)
export const TIPOS_SANCION = [
    { value: 'biblioteca', label: 'Biblioteca', className: 'bg-violet-50 text-violet-700 border-violet-100' },
    { value: 'casa', label: 'Casa', className: 'bg-sky-50 text-sky-700 border-sky-100' },
    { value: 'otros_centro', label: 'Otros en el centro', className: 'bg-teal-50 text-teal-700 border-teal-100' },
] as const

export type TipoSancion = typeof TIPOS_SANCION[number]['value']

export const labelTipoSancion = (tipo: string | null) =>
    TIPOS_SANCION.find(t => t.value === tipo)?.label ?? null

export const claseTipoSancion = (tipo: string | null) =>
    TIPOS_SANCION.find(t => t.value === tipo)?.className ?? null
