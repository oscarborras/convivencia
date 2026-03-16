'use client'

import { Check, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toggleUserRole } from '../actions'

interface UserRoleToggleProps {
    userId: string
    perfilId: number
    hasRole: boolean
}

export default function UserRoleToggle({ userId, perfilId, hasRole }: UserRoleToggleProps) {
    const [isPending, startTransition] = useTransition()
    const [optimisticHasRole, setOptimisticHasRole] = useState(hasRole)

    const handleToggle = () => {
        const newValue = !optimisticHasRole
        setOptimisticHasRole(newValue)

        startTransition(async () => {
            try {
                await toggleUserRole(userId, perfilId, !newValue) // passed 'hasRole' is what it IS currently
            } catch (error) {
                console.error(error)
                // Revert on error
                setOptimisticHasRole(!newValue)
            }
        })
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`
                relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${optimisticHasRole
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                    : 'bg-slate-200/50 text-slate-300 hover:bg-slate-200 hover:scale-105'}
                disabled:opacity-70 disabled:cursor-not-allowed
            `}
        >
            {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : optimisticHasRole ? (
                <Check className="w-5 h-5 stroke-[3]" />
            ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
            )}

            {/* Hover Indicator */}
            {!optimisticHasRole && !isPending && (
                <div className="absolute inset-0 rounded-full border-2 border-transparent hover:border-slate-300 transition-colors" />
            )}
        </button>
    )
}
