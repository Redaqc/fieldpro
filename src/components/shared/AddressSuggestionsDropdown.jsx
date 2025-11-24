import { MapPin, Loader2, AlertCircle } from 'lucide-react';

/**
 * Dropdown component for displaying address suggestions
 * Implements proper ARIA attributes for accessibility
 * 
 * @param {Object} props
 * @param {Array} props.suggestions - List of address suggestions
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.error - Error message
 * @param {number} props.selectedIndex - Currently selected item index
 * @param {Function} props.onSelect - Callback when suggestion is selected
 * @param {string} props.provider - API provider name
 * @param {string} props.listboxId - ID for the listbox (ARIA)
 */
export default function AddressSuggestionsDropdown({
  suggestions,
  isLoading,
  error,
  selectedIndex,
  onSelect,
  provider,
  listboxId,
}) {
  if (isLoading) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
        <div className="px-4 py-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Recherche d'adresses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
        <div className="px-4 py-6 text-center">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune suggestion trouvée</p>
          <p className="text-xs text-slate-400 mt-1">Essayez une autre recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      role="listbox"
      id={listboxId}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          role="option"
          id={`${listboxId}-option-${index}`}
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(suggestion)}
          onMouseEnter={(e) => {
            // Prevent scroll jumping on hover
            e.currentTarget.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            });
          }}
          className={`
            px-4 py-3 cursor-pointer flex items-start gap-3 border-b border-slate-100 last:border-0
            transition-colors duration-150
            ${
              index === selectedIndex
                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                : 'hover:bg-slate-50 border-l-4 border-l-transparent'
            }
          `}
        >
          <MapPin
            className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
              index === selectedIndex ? 'text-blue-600' : 'text-slate-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm leading-relaxed ${
                index === selectedIndex
                  ? 'text-blue-900 font-medium'
                  : 'text-slate-700'
              }`}
            >
              {suggestion.description}
            </p>
          </div>
        </div>
      ))}

      {provider === 'google' && (
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
          <span className="flex items-center gap-1">
            Powered by{' '}
            <span className="font-semibold text-slate-600">Google</span>
          </span>
        </div>
      )}

      {provider === 'mapbox' && (
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 bg-slate-50">
          <span className="flex items-center gap-1">
            Powered by{' '}
            <span className="font-semibold text-slate-600">Mapbox</span>
          </span>
        </div>
      )}
    </div>
  );
}