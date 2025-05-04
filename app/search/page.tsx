'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchInput } from '@/components/search/search-input';
import { SearchResults } from '@/components/search/search-results';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchSources } from '@/components/search/search-sources';
import { searchAPI, SearchResponse, SearchParams } from '@/lib/search/search-api';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Execute search when query changes
  useEffect(() => {
    if (!query) {
      setSearchResponse(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams: SearchParams = {
          q: query,
          limit: 20,
          sources: selectedSources.length ? selectedSources : undefined,
          filters: Object.keys(activeFilters).length ? activeFilters : undefined,
        };

        const results = await searchAPI.search(searchParams);
        setSearchResponse(results);
      } catch (err) {
        console.error('Search error:', err);
        setError('An error occurred while searching. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, selectedSources, activeFilters]);

  // Handle source selection
  const handleSourceChange = (sources: string[]) => {
    setSelectedSources(sources);
  };

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
  };

  // Handle new search
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) return;
    
    const params = new URLSearchParams();
    params.set('q', searchTerm);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search header */}
        <div className="mb-8">
          <SearchInput 
            defaultValue={query} 
            onSearch={handleSearch} 
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left sidebar - Filters and sources */}
          <div className="hidden lg:block">
            {searchResponse && (
              <>
                <div className="mb-8">
                  <SearchSources 
                    sources={searchResponse.sources || []} 
                    onSourceChange={handleSourceChange}
                    selectedSources={selectedSources}
                  />
                </div>

                <div>
                  <SearchFilters 
                    facets={searchResponse.facets || {}} 
                    onFilterChange={handleFilterChange}
                    activeFilters={activeFilters}
                  />
                </div>
              </>
            )}
          </div>

          {/* Main results area */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : !query ? (
              <div className="text-center text-muted-foreground py-12">
                <p>Enter a search query to get started</p>
              </div>
            ) : searchResponse ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Found {searchResponse.total} results ({searchResponse.execution_time.toFixed(2)}s)
                </div>
                <SearchResults results={searchResponse.results} query={query} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}