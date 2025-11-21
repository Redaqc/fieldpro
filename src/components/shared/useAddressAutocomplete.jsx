import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Custom hook for address autocomplete with debouncing, caching, and abort control
 * 
 * @param {Object} config - Configuration options
 * @param {number} config.fetchDelay - Debounce delay in ms (default: 400)
 * @param {number} config.maxResults - Maximum number of results (default: 10)
 * @param {number} config.minQueryLength - Minimum query length to trigger search (default: 3)
 * @param {number} config.cacheExpiry - Cache expiry time in ms (default: 5 minutes)
 * @returns {Object} Hook state and methods
 */
export function useAddressAutocomplete(config = {}) {
  const {
    fetchDelay = 400,
    maxResults = 10,
    minQueryLength = 3,
    cacheExpiry = 5 * 60 * 1000,
  } = config;

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('');

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const sessionTokenRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  // Clean up cache entries older than expiry time
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const entriesToDelete = [];
    
    for (const [key, value] of cacheRef.current.entries()) {
      if (now - value.timestamp > cacheExpiry) {
        entriesToDelete.push(key);
      }
    }
    
    entriesToDelete.forEach(key => cacheRef.current.delete(key));
  }, [cacheExpiry]);

  // Get from cache
  const getCached = useCallback((query) => {
    const cached = cacheRef.current.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
      return cached.data;
    }
    return null;
  }, [cacheExpiry]);

  // Set to cache
  const setCache = useCallback((query, data) => {
    cleanCache();
    cacheRef.current.set(query.toLowerCase(), {
      data,
      timestamp: Date.now(),
    });
  }, [cleanCache]);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < minQueryLength) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Check cache first
    const cached = getCached(query);
    if (cached) {
      setSuggestions(cached.suggestions || []);
      setProvider(cached.provider || '');
      setError(null);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('addressAutocomplete', {
        query: query.trim(),
        sessionToken: sessionTokenRef.current,
      });

      // Check if request was aborted
      if (abortControllerRef.current?.signal?.aborted) {
        return;
      }

      if (response?.data?.error) {
        const errorMsg = response.data.error;
        // Provide helpful message for configuration errors
        if (errorMsg.includes('not configured') || errorMsg.includes('API key') || errorMsg.includes('désactivée')) {
          setError('Configuration requise. Allez dans Paramètres > Address Autocomplete');
        } else {
          setError(errorMsg);
        }
        setSuggestions([]);
      } else if (response?.data?.suggestions && Array.isArray(response.data.suggestions)) {
        const limitedSuggestions = response.data.suggestions.slice(0, maxResults);
        setSuggestions(limitedSuggestions);
        setProvider(response.data.provider || '');
        
        // Cache the results
        setCache(query, {
          suggestions: limitedSuggestions,
          provider: response.data.provider || '',
        });
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !abortControllerRef.current?.signal?.aborted) {
        const errorMessage = err.message || 'Échec de la récupération des suggestions';
        console.error('[useAddressAutocomplete] Error:', errorMessage);
        setError(errorMessage);
        setSuggestions([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [minQueryLength, maxResults, getCached, setCache]);

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, fetchDelay);
  }, [fetchDelay, fetchSuggestions]);

  // Fetch address details
  const fetchAddressDetails = useCallback(async (placeId) => {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    try {
      const response = await base44.functions.invoke('addressDetails', {
        placeId,
        provider: provider || 'google',
      });

      if (response?.data?.error) {
        throw new Error(response.data.error);
      }

      return response?.data?.address || null;
    } catch (err) {
      const errorMessage = err.message || 'Échec de la récupération des détails';
      console.error('[useAddressAutocomplete] Address details error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [provider]);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    provider,
    search: debouncedSearch,
    fetchAddressDetails,
    clearSuggestions,
    clearError,
    clearCache,
  };
}