import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, Send } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the schema for the analysis form
const analysisFormSchema = z.object({
  prompt: z.string().min(1, "Please enter a question or prompt")
});

type AnalysisFormValues = z.infer<typeof analysisFormSchema>;

export default function StandupAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      prompt: ""
    },
  });

  // Fetch all standups
  const {
    data: standups,
    isLoading,
    error,
    refetch
  } = useQuery<Standup[]>({
    queryKey: ["/api/standups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Analyze standups mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: { prompt: string, standups: Standup[] }) => {
      const response = await apiRequest("POST", "/api/analyze-standups", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error("Error analyzing standups:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze standups",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  });

  const onSubmit = (data: AnalysisFormValues) => {
    if (!standups || standups.length === 0) {
      toast({
        title: "No data to analyze",
        description: "There are no standup records available for analysis",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    analyzeMutation.mutate({
      prompt: data.prompt,
      standups: standups
    });
  };

  // Example prompts for the user
  const examplePrompts = [
    "What are the common blockers faced by the team?",
    "Summarize the team's progress over time",
    "What are the main tasks being worked on recently?",
    "Identify any patterns in our team's work",
    "What's the overall sentiment and morale of the team?",
    "Who has been most productive based on completed tasks?",
  ];

  const handleExamplePrompt = (prompt: string) => {
    form.setValue("prompt", prompt);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Standup Analysis | DailyPulse</title>
      </Helmet>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Standup Analysis</h1>
        <p className="text-gray-600 mt-1">AI-powered insights from your standup data</p>
      </div>

      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
        <ResizablePanel defaultSize={40} className="bg-gray-50">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <div className="mb-6 flex items-center">
                <Bot className="h-6 w-6 mr-2 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-800">Claude AI Assistant</h2>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ask about your standup data</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What would you like to analyze about your standup data?"
                            className="min-h-[100px] resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Analyze Standups
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div className="p-6 border-t flex-1 overflow-auto">
              <h3 className="font-medium text-gray-700 mb-3">Example questions:</h3>
              <div className="space-y-2">
                {examplePrompts.map((prompt, index) => (
                  <Button 
                    key={index}
                    variant="ghost" 
                    className="w-full justify-start text-left h-auto py-2 px-3 font-normal text-gray-600 hover:text-gray-900"
                    onClick={() => handleExamplePrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-100 text-xs text-gray-500">
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Loading standup data...
                </div>
              ) : error ? (
                <div className="text-red-500">
                  Error loading data. Please refresh.
                </div>
              ) : (
                <div>
                  Analyzing {standups?.length || 0} standup records
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={60}>
          <div className="p-6 h-full flex flex-col">
            <div className="mb-4 flex items-center border-b pb-4">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Claude 3.5 Haiku Analysis</h3>
                <p className="text-xs text-gray-500">Powered by Amazon Bedrock</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto prose prose-sm max-w-none">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary-600" />
                  <p>Analyzing your standup data...</p>
                  <p className="text-xs">This may take a few seconds</p>
                </div>
              ) : analysis ? (
                <div className="whitespace-pre-wrap">
                  {analysis}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bot className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-center max-w-md">
                    Ask Claude to analyze your standup data. Try asking about team progress, 
                    blockers, trends, or team productivity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div className="mt-6 text-center text-sm text-gray-500">
        DailyPulse AI Analysis • Responses are generated by Claude 3.5 Haiku via Amazon Bedrock
      </div>
    </div>
  );
}