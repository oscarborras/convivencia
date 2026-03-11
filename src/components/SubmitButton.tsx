'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
    children: React.ReactNode
    className?: string
    loadingText?: string
}

export default function SubmitButton({ children, className = '', loadingText = 'Guardando...' }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`${className} flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    )
}
