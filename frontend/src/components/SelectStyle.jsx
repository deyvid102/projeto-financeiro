import React, { useState, useRef, useEffect } from 'react';
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
  const dropdownRef = useRef(null);

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    // Simulamos o evento que o seu formulário espera
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  // Encontra o selo/label da opção selecionada para mostrar no botão
  const selectedOption = options.find(opt => (opt.value || opt.name) === value);

  return (
    <div className="space-y-1 w-full relative" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-4">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Botão que abre o Select */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full py-4 bg-bg-main/50 border transition-all duration-300 flex items-center
            rounded-[1.5rem] text-sm font-bold outline-none text-left
            ${isOpen ? 'border-brand ring-4 ring-brand/5' : 'border-border-ui/50'}
            ${Icon ? 'pl-14' : 'pl-6'} pr-12
          `}
        >
          {/* Ícone Lateral */}
          {Icon && (
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-brand opacity-100' : 'text-text-secondary opacity-30'}`}>
              <Icon size={18} />
            </div>
          )}

          <span className={value ? "text-text-primary" : "text-text-secondary opacity-50"}>
            {selectedOption ? (selectedOption.label || selectedOption.name) : placeholder}
          </span>

          {/* Seta */}
          <div className={`absolute right-5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand opacity-100' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </button>

        {/* Lista de Opções Customizada */}
        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-bg-card border border-border-ui/50 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="p-4 text-xs text-text-secondary text-center italic">Nenhuma categoria encontrada</div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectStyle;