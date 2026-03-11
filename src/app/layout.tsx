import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' // Added toaster provider

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Partes y Retrasos - IES Julio Verne',
    description: 'Gestión de convivencia y amonestaciones',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <head>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            </head>
            <body className={inter.className}>
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    )
}
