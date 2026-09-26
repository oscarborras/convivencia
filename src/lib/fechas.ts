// Utilidades de fecha en la zona horaria del centro (Europe/Madrid).
// Funcionan igual en servidor y navegador, sea cual sea su zona horaria local,
// y se ajustan solas al cambio de hora de verano/invierno.

const TZ = 'Europe/Madrid'

// Fecha de hoy en España como 'YYYY-MM-DD' (sv-SE usa ese formato).
export function hoyMadrid(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
}

// Diferencia en ms entre la hora de Madrid y UTC en un instante dado.
function offsetMadridMs(date: Date): number {
    const utc = date.toLocaleString('sv-SE', { timeZone: 'UTC' })
    const madrid = date.toLocaleString('sv-SE', { timeZone: TZ })
    return new Date(madrid.replace(' ', 'T') + 'Z').getTime() - new Date(utc.replace(' ', 'T') + 'Z').getTime()
}

// Día de España ('YYYY-MM-DD') al que corresponde un timestamp.
export function diaMadrid(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleDateString('sv-SE', { timeZone: TZ })
}

// Instante (ISO UTC) en que empieza el día 'YYYY-MM-DD' a las 00:00 de España.
export function inicioDiaMadrid(fecha: string): string {
    const base = new Date(`${fecha}T00:00:00.000Z`)
    return new Date(base.getTime() - offsetMadridMs(base)).toISOString()
}

// Rango [inicio, fin) de un día de España, para filtrar columnas timestamptz
// con .gte(inicio).lt(fin).
export function rangoDiaMadrid(fecha: string): { inicio: string; fin: string } {
    const siguiente = new Date(`${fecha}T00:00:00.000Z`)
    siguiente.setUTCDate(siguiente.getUTCDate() + 1)
    return {
        inicio: inicioDiaMadrid(fecha),
        fin: inicioDiaMadrid(siguiente.toISOString().slice(0, 10)),
    }
}
