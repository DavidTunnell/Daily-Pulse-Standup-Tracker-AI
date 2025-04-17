import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { Standup } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Loader2,
  MessageSquare,
  Sparkles,
  BarChart,
  AlertCircle,
  SendHorizonal,
} from "lucide-react";


export default function StandupAnalysis() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch all standups
  const {
    data: standups,
    isLoading,
    error,
    refetch,
  } = useQuery<Standup[]>({
    queryKey: ["/api/standups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Define types for API responses
  interface SuggestionsResponse {
    suggestions: string[];
  }
  
  interface AnalysisResponse {
    analysis: string;
  }

  // Fetch prompt suggestions
  const {
    data: suggestionsData,
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
  } = useQuery<SuggestionsResponse>({
    queryKey: ["/api/prompt-suggestions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: standups !== undefined && standups.length > 0,
  });

  // Set suggestions when data is fetched
  useEffect(() => {
    if (suggestionsData?.suggestions) {
      setPromptSuggestions(suggestionsData.suggestions);
    }
  }, [suggestionsData]);

  // Analyze mutation
  const analyzeMutation = useMutation<AnalysisResponse, Error, string>({
    mutationFn: async (promptText: string) => {
      const res = await apiRequest("POST", "/api/analyze", { prompt: promptText });
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
    },
    onError: (error: Error) => {
      console.error("Error analyzing standups:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze standups. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeMutation.mutateAsync(prompt);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Standup Analysis | DailyPulse</title>
        <meta name="description" content="Analyze your team's standup data" />
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Logo size="lg" withText={false} className="mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Standup Analysis</h1>
            <p className="text-gray-600 mt-1">
              Ask questions about your team's standup data
            </p>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link to="/standups">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Standups
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
                Ask about your standups
              </CardTitle>
              <CardDescription>
                Enter your question about standup data to get AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="What would you like to know about your team's standups?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isAnalyzing || !prompt.trim()}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SendHorizonal className="h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Failed to load standup data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    There was an error loading your standups. Please try again.
                  </p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </div>
              ) : standups && standups.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No standup data available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Submit some standups first to use the analysis feature.
                  </p>
                  <Button asChild>
                    <Link to="/">Create New Standup</Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-6">
                  {analysis && (
                    <div className="p-6 bg-primary-50 rounded-lg border border-primary-100 mb-6">
                      <h3 className="text-lg font-medium text-primary-900 mb-4 flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
                        Analysis Results
                      </h3>
                      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                        {analysis}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
                Suggested Questions
              </CardTitle>
              <CardDescription>
                Try these questions to gain insights from your standups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promptSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {promptSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 whitespace-normal text-left"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Loading suggestions...
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-100 pt-4 text-xs text-gray-500">
              Click on any suggestion to use it
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary-600" />
                Standup Stats
              </CardTitle>
              <CardDescription>
                Quick overview of your standup data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Total Standups:</span>
                  <span className="font-semibold text-gray-900">
                    {standups?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Standups with Blockers:</span>
                  <span className="font-semibold text-gray-900">
                    {standups?.filter(s => 
                      s.blockers && 
                      s.blockers.toLowerCase() !== "none" && 
                      s.blockers.toLowerCase() !== "no blockers"
                    ).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Standups with Highlights:</span>
                  <span className="font-semibold text-gray-900">
                    {standups?.filter(s => s.highlights && s.highlights.trim() !== "").length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}