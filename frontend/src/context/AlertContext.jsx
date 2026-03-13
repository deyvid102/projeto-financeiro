import React, { createContext, useState, useContext, useCallback } from 'react'; // Adicione useCallback
import AlertStyle from '../components/AlertStyle';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ message: '', type: 'success' });

  // Use o useCallback para que a função não mude entre renderizações
  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertStyle 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert((prev) => ({ ...prev, message: '' }))} 
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);