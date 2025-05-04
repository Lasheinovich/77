/**
 * Ark7 Divine - SearchBar Component
 * A modern search interface similar to You.com with advanced embedding search capabilities
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { SearchResult, searchAPI } from '@/lib/search/search-api'
import { cn } from '@/lib/utils'
import { Loader2, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Placeholder text for the search input
   */
  placeholder?: string
  
  /**
   * Size of the search bar
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * Whether to show inline search results
   */
  showResults?: boolean
  
  /**
   * Default query to populate the search bar
   */
  defaultQuery?: string
  
  /**
   * Maximum number of inline results to show
   */
  maxResults?: number
  
  /**
   * Sources to search in, empty means all sources
   */
  sources?: string[]
  
  /**
   * Additional filters to apply to the search
   */
  filters?: Record<string, any>
  
  /**
   * Callback when a search is submitted
   */
  onSearch?: (query: string) => void
  
  /**
   * Callback when a result is selected
   */
  onResultSelect?: (result: SearchResult) => void
  
  /**
   * Callback to get search URL for a query
   * If provided, clicking search or pressing enter will navigate to this URL
   */
  getSearchUrl?: (query: string) => string
}

export function SearchBar({
  placeholder = "Search...",
  size = 'md',
  showResults = true,
  defaultQuery = '',
  maxResults = 5,
  sources = [],
  filters = {},
  onSearch,
  onResultSelect,
  getSearchUrl,
  className,
  ...props
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  
  // Sizes for the search input
  const sizeStyles = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  }

  // Fetch search results when the debounced query changes
  useEffect(() => {
    async function fetchResults() {
      if (!debouncedQuery.trim() || !showResults) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await searchAPI.search({
          q: debouncedQuery,
          limit: maxResults,
          sources,
          filters,
        })
        
        setResults(response.results)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery, maxResults, showResults, sources, filters])

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return
    
    if (onSearch) {
      onSearch(query)
    }
    
    if (getSearchUrl) {
      router.push(getSearchUrl(query))
    }
  }

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result)
    } else if (result.url) {
      window.open(result.url, '_blank')
    }
    
    // Clear results and blur input
    setResults([])
    inputRef.current?.blur()
  }

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        inputRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div 
      className={cn("relative", className)} 
      {...props}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn("flex items-center border rounded-full overflow-hidden bg-white dark:bg-gray-950", 
          sizeStyles[size],
          "border-gray-200 dark:border-gray-800",
          "hover:border-gray-300 dark:hover:border-gray-700",
          "focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary",
          "transition-all duration-200",
          isFocused ? "ring-1 ring-primary/20 border-primary" : ""
        )}>
          <div className="flex items-center justify-center px-3">
            <Search 
              className={cn(
                "text-gray-400 dark:text-gray-500",
                size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
              )} 
            />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={placeholder}
            className={cn(
              "flex-1 border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              sizeStyles[size]
            )}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              // Navigate to search page on Enter
              if (e.key === 'Enter' && getSearchUrl) {
                router.push(getSearchUrl(query))
              }
            }}
          />

          {isLoading && (
            <div className="flex items-center justify-center px-3">
              <Loader2 
                className={cn(
                  "animate-spin text-primary",
                  size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
                )} 
              />
            </div>
          )}
          
          {!isLoading && query.length > 0 && (
            <div className="flex items-center justify-center px-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className={cn(
                  "h-auto w-auto p-0",
                  "hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100",
                  "focus:bg-transparent"
                )}
              >
                <X 
                  className={cn(
                    "text-gray-400 dark:text-gray-500",
                    size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
                  )} 
                />
              </Button>
            </div>
          )}
        </div>
      </form>
      
      {isFocused && showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="py-2">
            {results.map((result, index) => (
              <div 
                key={result.id || index}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-150"
                onClick={() => handleResultClick(result)}
              >
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.title}</h4>
                {result.highlights && result.highlights.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {result.highlights[0]}
                  </p>
                )}
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{result.source}</span>
                  <div className="mx-1 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(result.score * 100)}% match</span>
                </div>
              </div>
            ))}
            
            {getSearchUrl && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-primary text-sm hover:text-primary hover:bg-primary/5"
                  onClick={() => {
                    if (getSearchUrl) {
                      router.push(getSearchUrl(query))
                    }
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search for &quot;{query}&quot;
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}