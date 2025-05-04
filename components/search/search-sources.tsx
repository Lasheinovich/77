'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface SearchSourcesProps {
  sources: string[];
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
}

export function SearchSources({
  sources,
  selectedSources,
  onSourceChange,
}: SearchSourcesProps) {
  // Skip rendering if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  // Format source name for display (e.g., "web" -> "Web")
  const formatSourceName = (source: string): string => {
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  // Check if a source is selected
  const isSelected = (source: string): boolean => {
    return selectedSources.includes(source);
  };

  // Toggle a source selection
  const toggleSource = (source: string) => {
    if (isSelected(source)) {
      onSourceChange(selectedSources.filter(s => s !== source));
    } else {
      onSourceChange([...selectedSources, source]);
    }
  };

  // Clear all selected sources
  const clearSources = () => {
    onSourceChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Sources</h2>
        
        {selectedSources.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSources}
            className="text-xs h-7"
          >
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {sources.map(source => (
          <Button
            key={source}
            variant="outline"
            size="sm"
            className={cn(
              "justify-start w-full px-3 py-2 h-auto",
              isSelected(source) && "border-primary bg-primary/10"
            )}
            onClick={() => toggleSource(source)}
          >
            <div className="flex items-center w-full">
              <span className="mr-2 flex h-4 w-4 items-center justify-center">
                {isSelected(source) && (
                  <CheckIcon className="h-3 w-3 text-primary" />
                )}
              </span>
              <span className="flex-1">{formatSourceName(source)}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}