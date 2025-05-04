'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SearchResult } from '@/lib/search/search-api';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (!results.length) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border">
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground">
          Try different keywords or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <SearchResultItem 
          key={result.id || `result-${index}`} 
          result={result} 
          query={query} 
        />
      ))}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
}

function SearchResultItem({ result, query }: SearchResultItemProps) {
  // Determine if the result is external (has a URL) or internal
  const isExternal = result.url?.startsWith('http');
  
  // Get the domain from URL if external
  const domain = result.url ? extractDomain(result.url) : '';
  
  // Format timestamp if available
  const formattedDate = result.timestamp ? formatDate(result.timestamp) : '';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        {/* Result header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            {isExternal ? (
              <a 
                href={result.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-lg text-primary hover:underline"
              >
                {result.title}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <Link 
                href={result.url || '#'} 
                className="font-medium text-lg text-primary hover:underline"
              >
                {result.title}
              </Link>
            )}
            
            {domain && (
              <div className="text-sm text-muted-foreground mt-1">
                {domain}
              </div>
            )}
          </div>
          
          {/* Score badge - only show if above certain threshold */}
          {result.score > 0.7 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {Math.round(result.score * 100)}% match
            </Badge>
          )}
        </div>
        
        {/* Content with highlights */}
        <div className="mt-2">
          {result.highlights.length > 0 ? (
            <div className="text-sm text-muted-foreground space-y-1">
              {result.highlights.map((highlight, idx) => (
                <p key={idx} className="bg-muted/20 p-2 rounded">
                  {highlight}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {result.content}
            </p>
          )}
        </div>
        
        {/* Footer metadata */}
        <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          {/* Source */}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {result.source}
          </Badge>
          
          {/* Additional metadata */}
          {result.metadata?.type && (
            <Badge variant="outline">
              {result.metadata.type}
            </Badge>
          )}
          
          {/* Date */}
          {formattedDate && (
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// Helper functions
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return '';
  }
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch {
    return '';
  }
}