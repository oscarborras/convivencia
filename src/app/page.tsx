import { redirect } from 'next/navigation'

export default function Home() {
    // Redirigimos por defecto a la página principal del dashboard
    redirect('/dashboard')
}
