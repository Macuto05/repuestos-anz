'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    // Si no hay páginas o hay solo una, no mostrar nada
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Siempre mostrar la primera página
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Mostrar páginas alrededor de la actual
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Siempre mostrar la última página
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    title="Anterior"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 mx-1">
                    {getVisiblePages().map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`dots-${index}`} className="px-2 text-slate-400 font-medium">
                                    ...
                                </span>
                            );
                        }

                        const isCurrent = currentPage === page;

                        return (
                            <button
                                key={`page-${page}`}
                                onClick={() => onPageChange(page as number)}
                                className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm flex items-center justify-center ${isCurrent
                                        ? 'bg-blue-600 text-white border border-blue-600 ring-2 ring-blue-600/10'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    title="Siguiente"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="hidden sm:block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
            </div>
        </div>
    );
}
