'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    total: number
    limit: number
    currentPage: number
}

export default function Pagination({ total, limit, currentPage }: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const totalPages = Math.ceil(total / limit)
    
    if (totalPages <= 1) return null

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
            <div className="text-sm text-gray-500 font-medium">
                Mostrando <span className="text-gray-900 font-bold">{(currentPage - 1) * limit + 1}</span> a <span className="text-gray-900 font-bold">{Math.min(currentPage * limit, total)}</span> de <span className="text-gray-900 font-bold">{total}</span> registros
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-all active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1
                        // Logic to show limited pages if total is high
                        if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={i}
                                    onClick={() => goToPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                                        currentPage === pageNum 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                        : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        } else if (
                            pageNum === currentPage - 2 || 
                            pageNum === currentPage + 2
                        ) {
                            return <span key={i} className="px-1 text-gray-300">...</span>
                        }
                        return null
                    })}
                </div>

                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-all active:scale-95"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
