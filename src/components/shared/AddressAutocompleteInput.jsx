import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

export default function AddressAutocompleteInput({
  label = "Adresse",
  placeholder = "Commencez à taper une adresse...",
  defaultValue = "",
  onAddressSelected,
  className = ""
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [provider, setProvider] = useState('');
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  
  const debounceTimer = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('addressAutocomplete', {
        query: searchQuery,
        sessionToken
      });

      console.log('Address autocomplete response:', response);

      if (response?.data?.suggestions) {
        setSuggestions(response.data.suggestions);
        setProvider(response.data.provider);
        setShowDropdown(response.data.suggestions.length > 0);
      } else if (response?.data?.error) {
        console.error('API Error:', response.data.error);
        alert('Erreur: ' + response.data.error);
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Address autocomplete error:', error);
      alert('Erreur de connexion: ' + error.message);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 400);
  };

  const handleSelectSuggestion = async (suggestion) => {
    setQuery(suggestion.description);
    setShowDropdown(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('addressDetails', {
        placeId: suggestion.place_id,
        provider
      });

      console.log('Address details response:', response);

      if (response?.data?.address && onAddressSelected) {
        onAddressSelected(response.data.address);
      } else if (response?.data?.error) {
        console.error('API Error:', response.data.error);
        alert('Erreur: ' + response.data.error);
      }
    } catch (error) {
      console.error('Address details error:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`
                px-4 py-3 cursor-pointer flex items-start gap-2 border-b border-slate-100 last:border-0
                ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
              `}
            >
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">{suggestion.description}</span>
            </div>
          ))}
          
          {provider === 'google' && (
            <div className="px-4 py-2 text-xs text-slate-400 border-t">
              Powered by Google
            </div>
          )}
        </div>
      )}
    </div>
  );
}