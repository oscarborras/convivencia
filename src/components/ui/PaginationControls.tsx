'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    total: number
    page: number
    perPage: number
}

const PAGE_SIZES = [10, 25, 50]

export default function PaginationControls({ total, page, perPage }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const totalPages = Math.ceil(total / perPage)

    const navigate = (newPage: number, newPerPage?: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(newPage))
        if (newPerPage) {
            params.set('per_page', String(newPerPage))
            params.set('page', '1')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const from = total === 0 ? 0 : (page - 1) * perPage + 1
    const to = Math.min(page * perPage, total)

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Registros por página:</span>
                <div className="flex gap-1">
                    {PAGE_SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => navigate(1, size)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${perPage === size
                                ? 'bg-primary-brand text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">
                    {from}–{to} de <strong>{total}</strong>
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => navigate(page - 1)}
                        disabled={page <= 1}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate(page + 1)}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
