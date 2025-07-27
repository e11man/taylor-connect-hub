import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandList, CommandItem } from '@/components/ui/command';
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
}

/**
 * AddressAutocomplete
 * --------------------
 * A lightweight, dependency-free React component that adds as-you-type address
 * suggestions powered by the free Geoapify Places Autocomplete API.
 *
 * – No Google Maps API required.
 * – Debounced network requests (300 ms).
 * – Returns rich, structured address details including lat/lon.
 * – Designed to integrate seamlessly with shadcn-ui / Tailwind.
 */
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onSelect,
  placeholder = 'Start typing an address…',
  className,
  initialValue = null,
}) => {
  const [query, setQuery] = useState(initialValue?.formatted ?? '');
  const [suggestions, setSuggestions] = useState<AddressDetails[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // NOTE: For now we store the key in plain text as requested.
  const apiKey = "470d678e463c4c87aadc70eaeecec1f2";

  /** Fetch suggestions when query changes (debounced) */
  useEffect(() => {
    // Reset if the user cleared the field
    if (!query) {
      setSuggestions([]);
      onSelect(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const endpoint = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query,
        )}&format=json&limit=5&apiKey=${apiKey}`;
        const res = await fetch(endpoint);
        const data = await res.json();
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
        setOpen(true);
      } catch (err) {
        console.error('Failed to fetch address suggestions', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, apiKey, onSelect]);

  const handleSelect = (s: AddressDetails) => {
    setQuery(s.formatted);
    setSuggestions([]);
    setOpen(false);
    onSelect(s);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Clear previous selection when the user starts typing again
            onSelect(null);
          }}
          placeholder={placeholder}
          className={clsx(className)}
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command>
          <CommandList>
            {loading && (
              <div className="py-2 text-center text-sm text-muted-foreground">Searching…</div>
            )}
            {!loading && suggestions.length === 0 && (
              <div className="py-2 text-center text-sm text-muted-foreground">No results</div>
            )}
            {suggestions.map((s, idx) => (
              <CommandItem key={idx} onSelect={() => handleSelect(s)}>
                {s.formatted}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AddressAutocomplete;