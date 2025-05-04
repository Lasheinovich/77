'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SearchFiltersProps {
  facets: Record<string, Record<string, number>>;
  onFilterChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
}

export function SearchFilters({
  facets,
  onFilterChange,
  activeFilters,
}: SearchFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    types: true,
    domains: true,
  });

  // Format facet name for display
  const formatFacetName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Toggle a filter value
  const toggleFilter = (category: string, value: string) => {
    const newFilters = { ...activeFilters };
    
    if (!newFilters[category]) {
      newFilters[category] = [value];
    } else if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter((v: string) => v !== value);
      if (newFilters[category].length === 0) {
        delete newFilters[category];
      }
    } else {
      newFilters[category] = [...newFilters[category], value];
    }
    
    onFilterChange(newFilters);
  };

  // Get the count of active filters
  const getActiveFilterCount = (): number => {
    return Object.values(activeFilters).reduce(
      (count, values) => count + (Array.isArray(values) ? values.length : 1),
      0
    );
  };

  // Clear all filters
  const clearFilters = () => {
    onFilterChange({});
  };

  // Toggle collapsible section
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // If no facets available, don't render anything
  if (!facets || Object.keys(facets).length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Filters</h2>
        
        {getActiveFilterCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-7"
          >
            Clear all
          </Button>
        )}
      </div>

      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(activeFilters).map(([category, values]) => (
            Array.isArray(values) && values.map((value) => (
              <Badge 
                key={`${category}-${value}`}
                variant="secondary" 
                className="px-2 py-1"
              >
                {value}
                <button
                  className="ml-1 text-xs"
                  onClick={() => toggleFilter(category, value)}
                >
                  ×
                </button>
              </Badge>
            ))
          ))}
        </div>
      )}

      {Object.entries(facets).map(([facetName, values]) => {
        // Skip if no values
        if (Object.keys(values).length === 0) return null;
        
        return (
          <Collapsible
            key={facetName}
            open={openSections[facetName]}
            onOpenChange={() => toggleSection(facetName)}
            className="border-b pb-4"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full justify-between p-0 h-10"
              >
                <span className="font-medium">
                  {formatFacetName(facetName)}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openSections[facetName] ? 'rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2 space-y-2">
              {Object.entries(values)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 10)
                .map(([value, count]) => (
                  <div
                    key={`${facetName}-${value}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${facetName}-${value}`}
                        checked={
                          activeFilters[facetName]?.includes(value) || false
                        }
                        onCheckedChange={() => toggleFilter(facetName, value)}
                      />
                      <label
                        htmlFor={`${facetName}-${value}`}
                        className="text-sm cursor-pointer flex-1 truncate"
                      >
                        {value}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}