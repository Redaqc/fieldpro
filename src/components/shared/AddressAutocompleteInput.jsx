import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, X, AlertCircle } from 'lucide-react';
import { useAddressAutocomplete } from './useAddressAutocomplete';
import AddressSuggestionsDropdown from './AddressSuggestionsDropdown';

/**
 * Enterprise-grade Address Autocomplete Input Component
 * 
 * Features:
 * - Debounced API calls with AbortController
 * - In-memory caching for repeated queries
 * - Keyboard navigation (↑ ↓ Enter Esc)
 * - Full ARIA accessibility
 * - Auto-close on outside click or scroll
 * - Controlled and uncontrolled modes
 * - Comprehensive error handling
 * - Loading and empty states
 * - Race condition prevention
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.value - Controlled value
 * @param {string} props.defaultValue - Uncontrolled default value
 * @param {Function} props.onChange - Callback when input changes
 * @param {Function} props.onAddressSelected - Callback with full address details
 * @param {number} props.fetchDelay - Debounce delay (default: 400ms)
 * @param {number} props.maxResults - Max number of results (default: 10)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disable input
 * @param {boolean} props.required - Mark as required
 * @param {string} props.error - External error message
 */
export default function AddressAutocompleteInput({
  label = 'Adresse',
  placeholder = 'Commencez à taper une adresse...',
  value: controlledValue,
  defaultValue = '',
  onChange,
  onAddressSelected,
  fetchDelay = 400,
  maxResults = 10,
  className = '',
  disabled = false,
  required = false,
  error: externalError,
}) {
  // Controlled vs uncontrolled state
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = isControlled ? controlledValue : uncontrolledValue;

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const listboxId = useId();
  const comboboxId = useId();

  const {
    suggestions,
    isLoading,
    error: hookError,
    provider,
    search,
    fetchAddressDetails,
    clearSuggestions,
    clearError,
  } = useAddressAutocomplete({
    fetchDelay,
    maxResults,
  });

  // Combined error
  const error = externalError || hookError;

  // Show dropdown logic
  useEffect(() => {
    if (suggestions.length > 0 || isLoading) {
      setShowDropdown(true);
    } else if (!isLoading && suggestions.length === 0) {
      const timer = setTimeout(() => {
        if (!isSelecting) {
          setShowDropdown(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [suggestions.length, isLoading, isSelecting]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    
    if (onChange) {
      onChange(e);
    }

    setSelectedIndex(-1);
    clearError();
    
    if (newValue.trim()) {
      search(newValue);
    } else {
      clearSuggestions();
      setShowDropdown(false);
    }
  }, [isControlled, onChange, clearError, search, clearSuggestions]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(async (suggestion) => {
    if (!suggestion) return;

    setIsSelecting(true);
    
    try {
      const newValue = suggestion.description;
      
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      if (onChange) {
        onChange({ target: { value: newValue } });
      }

      setShowDropdown(false);
      clearSuggestions();
      setSelectedIndex(-1);

      if (onAddressSelected && suggestion.place_id) {
        const addressDetails = await fetchAddressDetails(suggestion.place_id);
        if (addressDetails) {
          onAddressSelected(addressDetails);
        }
      }
    } catch (err) {
      console.error('[AddressAutocomplete] Failed to fetch address details:', err);
    } finally {
      setIsSelecting(false);
      inputRef.current?.focus();
    }
  }, [isControlled, onChange, clearSuggestions, onAddressSelected, fetchAddressDetails]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  }, [showDropdown, suggestions, selectedIndex, handleSelectSuggestion]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = document.getElementById(
        `${listboxId}-option-${selectedIndex}`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex, listboxId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDropdown]);

  // Clear input
  const handleClear = useCallback(() => {
    const newValue = '';
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    if (onChange) {
      onChange({ target: { value: newValue } });
    }
    clearSuggestions();
    setShowDropdown(false);
    setSelectedIndex(-1);
    clearError();
    inputRef.current?.focus();
  }, [isControlled, onChange, clearSuggestions, clearError]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor={comboboxId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative mt-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        
        <Input
          ref={inputRef}
          id={comboboxId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          aria-activedescendant={
            selectedIndex >= 0
              ? `${listboxId}-option-${selectedIndex}`
              : undefined
          }
          role="combobox"
          className={`pl-9 pr-9 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
            aria-label="Effacer"
            tabIndex={-1}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {showDropdown && (
        <div ref={dropdownRef}>
          <AddressSuggestionsDropdown
            suggestions={suggestions}
            isLoading={isLoading}
            error={hookError}
            selectedIndex={selectedIndex}
            onSelect={handleSelectSuggestion}
            provider={provider}
            listboxId={listboxId}
          />
        </div>
      )}
    </div>
  );
}