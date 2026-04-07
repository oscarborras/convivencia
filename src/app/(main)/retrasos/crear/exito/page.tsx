import ExitoClient from './ExitoClient'

export default async function ExitoRetrasoPage({
    searchParams,
}: {
    searchParams: { alumno?: string; curso?: string; fecha?: string; emails?: string; obs?: string }
}) {
    // Next 14/15 searchParams is a promise o plain object
    const sp = await searchParams;
    
    return (
        <ExitoClient 
            alumno={sp.alumno || 'Desconocido'} 
            curso={sp.curso || ''} 
            fecha={sp.fecha || ''} 
            emails={sp.emails || ''}
            obs={sp.obs || ''}
        />
    )
}
