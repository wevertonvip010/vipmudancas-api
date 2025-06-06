// Hook personalizado para gerenciar loading states
import { useState, useCallback } from 'react';

export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const withLoading = useCallback(async (asyncFunction) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (err) {
      setError(err.message || 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    withLoading,
    clearError,
    setLoading,
    setError
  };
};

// Hook para notificações toast
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

// Hook para formulários
export const useForm = (initialValues = {}, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando valor muda
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const validateField = useCallback((name, value) => {
    if (!validationSchema || !validationSchema[name]) return null;
    
    const fieldValidation = validationSchema[name];
    
    if (fieldValidation.required && (!value || value.toString().trim() === '')) {
      return fieldValidation.requiredMessage || `${name} é obrigatório`;
    }
    
    if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
      return fieldValidation.minLengthMessage || `${name} deve ter pelo menos ${fieldValidation.minLength} caracteres`;
    }
    
    if (fieldValidation.pattern && !fieldValidation.pattern.test(value)) {
      return fieldValidation.patternMessage || `${name} tem formato inválido`;
    }
    
    if (fieldValidation.custom) {
      return fieldValidation.custom(value);
    }
    
    return null;
  }, [validationSchema]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    Object.keys(values).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Marcar todos os campos como touched
    const allTouched = {};
    Object.keys(values).forEach(name => {
      allTouched[name] = true;
    });
    setTouched(allTouched);
    
    // Validar formulário
    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erro no submit:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validateForm]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset
  };
};

// Hook para paginação
export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Hook para busca/filtro
export const useSearch = (data = [], searchFields = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  
  const filteredData = useMemo(() => {
    let result = data;
    
    // Aplicar busca por texto
    if (searchTerm) {
      result = result.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Aplicar filtros
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key];
      if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
        result = result.filter(item => {
          if (typeof filterValue === 'function') {
            return filterValue(item[key]);
          }
          return item[key] === filterValue;
        });
      }
    });
    
    return result;
  }, [data, searchTerm, filters, searchFields]);
  
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);
  
  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    filteredData
  };
};

export default {
  useLoading,
  useToast,
  useForm,
  usePagination,
  useSearch
};

