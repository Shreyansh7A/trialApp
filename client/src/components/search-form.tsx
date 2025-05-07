import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { AppSuggestion, searchAppSuggestions } from "@/lib/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  appName: z.string().min(1, { 
    message: "App name or package ID is required" 
  }).max(255, { 
    message: "App name or package ID must be less than 255 characters" 
  }),
});

type SearchFormProps = {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
};

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [suggestions, setSuggestions] = useState<AppSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: "",
    },
  });

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchAppSuggestions(query);
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching app suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout to debounce the search
    if (searchQuery) {
      searchTimeoutRef.current = window.setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("appName", value);
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: AppSuggestion) => {
    form.setValue("appName", suggestion.appId);
    setSearchQuery(suggestion.appId);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    setShowSuggestions(false);
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
          Analyze App Reviews
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="appName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-600 dark:text-neutral-300">
                    Android App Name or Package ID
                  </FormLabel>
                  <FormControl>
                    <div className="relative" ref={suggestionsRef}>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        placeholder="e.g. com.spotify.music or Spotify"
                        className="pl-10"
                        disabled={isLoading}
                        {...field}
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={() => setShowSuggestions(true)}
                      />
                      
                      {/* Suggestions dropdown */}
                      {showSuggestions && (suggestions.length > 0 || isSearching) && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700">
                          {isSearching && (
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                              Searching...
                            </div>
                          )}
                          
                          {!isSearching && suggestions.map((suggestion) => (
                            <div
                              key={suggestion.appId}
                              className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={suggestion.icon} alt={suggestion.title} />
                                <AvatarFallback>{suggestion.title.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{suggestion.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {suggestion.developer}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                  {suggestion.appId}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the Google Play Store app name or package ID
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="inline-flex items-center"
              >
                <Search className="mr-2 h-4 w-4" />
                Analyze Sentiment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
