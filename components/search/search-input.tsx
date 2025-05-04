'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';

interface SearchInputProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  defaultValue = '',
  onSearch,
  placeholder = 'Search the knowledge base...',
  className = '',
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-16 py-6 text-base rounded-full border-2 focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-[70px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        <Button
          type="submit"
          variant="default"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 rounded-full"
          disabled={!query.trim()}
        >
          Search
        </Button>
      </div>
    </form>
  );
}