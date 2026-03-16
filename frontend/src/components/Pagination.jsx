import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* BOTÃO VOLTAR */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-border-ui bg-bg-card text-text-secondary hover:text-brand hover:border-brand disabled:opacity-30 disabled:hover:border-border-ui disabled:hover:text-text-secondary transition-all"
      >
        <ChevronLeft size={18} />
      </button>

      {/* NÚMEROS DAS PÁGINAS */}
      <div className="flex items-center gap-2">
        {getPages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="px-2 text-text-secondary">
                <MoreHorizontal size={16} />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`
                  min-w-[40px] h-[40px] rounded-xl text-[11px] font-black italic transition-all border
                  ${currentPage === page 
                    ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20 scale-110 z-10' 
                    : 'bg-bg-card border-border-ui text-text-secondary hover:border-brand/50 hover:text-brand'
                  }
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* BOTÃO PRÓXIMO */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-border-ui bg-bg-card text-text-secondary hover:text-brand hover:border-brand disabled:opacity-30 disabled:hover:border-border-ui disabled:hover:text-text-secondary transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;