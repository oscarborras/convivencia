// Tipos de sanción (valores de convi_sanciones.tipo)
export const TIPOS_SANCION = [
    { value: 'biblioteca', label: 'Biblioteca' },
    { value: 'casa', label: 'Casa' },
    { value: 'otros_centro', label: 'Otros en el centro' },
] as const

export type TipoSancion = typeof TIPOS_SANCION[number]['value']

export const labelTipoSancion = (tipo: string | null) =>
    TIPOS_SANCION.find(t => t.value === tipo)?.label ?? null
