import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const SelectStyle = ({ 
  label, 
  icon: Icon, 
  options = [], 
  value, 
  onChange, 
  placeholder = "Selecione...",
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Calcula a posição do botão para alinhar a lista flutuante
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => (opt.value || opt.name) === value);

  return (
    <div className="space-y-1 w-full relative">
      {label && (
        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full py-4 bg-bg-main/50 border transition-all duration-300 flex items-center
            rounded-[1.5rem] text-sm font-bold outline-none text-left
            ${isOpen ? 'border-brand ring-4 ring-brand/5' : 'border-border-ui/50'}
            ${Icon ? 'pl-14' : 'pl-6'} pr-12
          `}
        >
          {Icon && (
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-brand opacity-100' : 'text-text-secondary opacity-30'}`}>
              <Icon size={18} />
            </div>
          )}

          <span className={value ? "text-text-primary" : "text-text-secondary opacity-50"}>
            {selectedOption ? (selectedOption.label || selectedOption.name) : placeholder}
          </span>

          <div className={`absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand opacity-100' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </button>

        {/* Portal: Joga a lista para fora do Modal (no final do body) */}
        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed z-[9999] bg-bg-card border border-border-ui/50 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              top: `${coords.top + 8}px`, 
              left: `${coords.left}px`, 
              width: `${coords.width}px` 
            }}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="p-4 text-xs text-text-secondary text-center italic">Nenhuma opção encontrada</div>
              ) : (
                options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(option.value || option.name)}
                    className={`
                      w-full text-left px-6 py-3.5 text-sm font-medium transition-colors
                      hover:bg-brand/10 hover:text-brand
                      ${value === (option.value || option.name) ? 'bg-brand text-white' : 'text-text-primary'}
                      ${idx !== options.length - 1 ? 'border-b border-border-ui/10' : ''}
                    `}
                  >
                    {option.label || option.name}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default SelectStyle;