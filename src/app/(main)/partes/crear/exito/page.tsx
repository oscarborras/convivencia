import ExitoClient from './ExitoClient'

export default async function ExitoPartePage({
    searchParams,
}: {
    searchParams: { alumno?: string; emails?: string }
}) {
    // Next 14/15 searchParams is a promise or a plain object depending on the version,
    const sp = await searchParams;
    
    return (
        <ExitoClient 
            alumno={sp.alumno || 'Desconocido'} 
            emails={sp.emails || ''}
        />
    )
}
