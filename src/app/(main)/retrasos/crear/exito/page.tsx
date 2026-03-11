import ExitoClient from './ExitoClient'

export default async function ExitoRetrasoPage({
    searchParams,
}: {
    searchParams: { alumno?: string; curso?: string; fecha?: string; emails?: string }
}) {
    // Next 14/15 searchParams is a promise or a plain object depending on the version,
    // Safest access for dynamic server-side params:
    const sp = await searchParams;
    
    return (
        <ExitoClient 
            alumno={sp.alumno || 'Desconocido'} 
            curso={sp.curso || ''} 
            fecha={sp.fecha || ''} 
            emails={sp.emails || ''}
        />
    )
}
