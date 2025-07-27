import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import clsx from 'clsx';

export interface AddressDetails {
  formatted: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

interface AddressAutocompleteProps {
  /** Callback fired when the user selects a suggestion (or clears the field) */
  onSelect: (value: AddressDetails | null) => void;
  /** Optional placeholder for the underlying input */
  placeholder?: string;
  /** Tailwind / custom class names applied to the wrapper */
  className?: string;
  /** Initial value if you need to pre-fill the input */
  initialValue?: AddressDetails | null;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Disable the input */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Input name attribute */
  name?: string;
  /** Input id attribute */
  id?: string;
}

// Debounce function
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * AddressAutocomplete
 * --------------------
 * A robust React component that adds as-you-type address
 * suggestions powered by the free Geoapify Places Autocomplete API.
 *
 * Features:
 * – Debounced network requests
 * – Error handling with fallback
 * – Accessibility support
 * – Mobile-friendly
 * – No dependencies beyond shadcn-ui
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelect,
  placeholder = 'Start typing an address…',
  className,
  initialValue = null,
  debounceDelay = 300,
  disabled = false,
  required = false,
  name,
  id,
}) => {
  const [query, setQuery] = useState(initialValue?.formatted ?? '');
  const [suggestions, setSuggestions] = useState<AddressDetails[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [retryCount, setRetryCount] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // API key - In production, this should be stored in environment variables
  // For now, using the provided key as requested
  // TODO: Move to environment variable (e.g., VITE_GEOAPIFY_API_KEY)
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || "470d678e463c4c87aadc70eaeecec1f2";

  // Fetch suggestions with retry logic
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const endpoint = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        searchQuery
      )}&format=json&limit=5&apiKey=${apiKey}`;
      
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const results = (data?.results ?? []) as any[];
      
      const mapped: AddressDetails[] = results.map((r) => ({
        formatted: r.formatted ?? '',
        street: r.street ?? r.name,
        housenumber: r.housenumber,
        city: r.city,
        state: r.state,
        postcode: r.postcode,
        country: r.country,
        lat: r.lat,
        lon: r.lon,
      }));
      
      setSuggestions(mapped);
      setShowDropdown(mapped.length > 0);
      setSelectedIndex(-1);
      setRetryCount(0);
    } catch (err) {
      console.error('Failed to fetch address suggestions:', err);
      
      // Retry logic
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchSuggestions(searchQuery), 1000 * (retryCount + 1));
      } else {
        setError('Unable to fetch suggestions. Please try again.');
        setSuggestions([]);
        setShowDropdown(false);
      }
    } finally {
      setLoading(false);
    }
  }, [apiKey, retryCount]);

  // Debounced fetch
  const debouncedFetch = useDebounce(fetchSuggestions, debounceDelay);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!value) {
      setSuggestions([]);
      setShowDropdown(false);
      onSelect(null);
    } else {
      debouncedFetch(value);
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: AddressDetails) => {
    setQuery(suggestion.formatted);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSelect(suggestion);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus management
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-label="Address search"
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-expanded={showDropdown}
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
          className={clsx(
            'pr-10',
            error && 'border-red-500 focus:ring-red-500'
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="address-suggestions"
          role="listbox"
          aria-label="Address suggestions"
          className={clsx(
            'absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg',
            'border border-gray-200 max-h-60 overflow-auto',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <Command>
            <CommandList>
              {suggestions.length === 0 && !loading && (
                <CommandEmpty>No addresses found.</CommandEmpty>
              )}
              {suggestions.map((suggestion, index) => (
                <CommandItem
                  key={index}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onSelect={() => handleSelect(suggestion)}
                  className={clsx(
                    'px-3 py-2 cursor-pointer',
                    index === selectedIndex && 'bg-gray-100'
                  )}
                >
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {suggestion.street && suggestion.housenumber
                        ? `${suggestion.housenumber} ${suggestion.street}`
                        : suggestion.street || suggestion.formatted.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[suggestion.city, suggestion.state, suggestion.postcode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;