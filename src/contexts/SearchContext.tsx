import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  max_participants: number | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  arrival_time: string | null;
  estimated_end_time: string | null;
  image_url: string | null;
}

interface SearchState {
  query: string;
  activeCategory: string;
  filteredEvents: Event[];
  isLoading: boolean;
  error: string | null;
}

interface SearchContextType extends SearchState {
  setQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SearchState>({
    query: '',
    activeCategory: 'all',
    filteredEvents: [],
    isLoading: false,
    error: null,
  });

  const debouncedQuery = useDebounce(state.query, 300);

  const searchEvents = useCallback(async () => {
    if (!debouncedQuery && state.activeCategory === 'all') {
      // Show all events when no search criteria
      setState(prev => ({ ...prev, filteredEvents: [], isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let query = supabase.from('events').select('*');

      // Apply search query
      if (debouncedQuery) {
        query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        filteredEvents: data || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to search events',
        isLoading: false,
      }));
    }
  }, [debouncedQuery]);

  useEffect(() => {
    searchEvents();
  }, [searchEvents]);

  const setQuery = (query: string) => {
    setState(prev => ({ ...prev, query }));
  };

  const setActiveCategory = (category: string) => {
    setState(prev => ({ ...prev, activeCategory: category }));
  };

  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      query: '',
      activeCategory: 'all',
      filteredEvents: [],
    }));
  };

  return (
    <SearchContext.Provider
      value={{
        ...state,
        setQuery,
        setActiveCategory,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};