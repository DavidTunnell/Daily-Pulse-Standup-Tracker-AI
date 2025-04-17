import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertStandupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Extend the insertStandupSchema with custom validation
const formSchema = insertStandupSchema.extend({
  yesterday: z.string().min(1, "Please share what you worked on yesterday"),
  today: z.string().min(1, "Please share what you're working on today"),
  blockers: z.string().min(1, "Please share any blockers or enter 'None'"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  yesterday: "",
  today: "",
  blockers: "",
  highlights: "",
};

const StandupForm = () => {
  const { toast } = useToast();
  const [formState, setFormState] = useState<"form" | "success" | "error">("form");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const standupMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/standups", data);
      return response.json();
    },
    onSuccess: () => {
      setFormState("success");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit standup",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      setFormState("error");
    },
  });

  const onSubmit = (data: FormValues) => {
    standupMutation.mutate(data);
  };

  const handleSubmitAnother = () => {
    form.reset(defaultValues);
    setFormState("form");
  };

  const handleTryAgain = () => {
    setFormState("form");
  };

  return (
    <Card className="w-full max-w-xl bg-white rounded-xl shadow-md overflow-hidden animate-fade-in">
      <CardHeader className="px-6 py-8 text-center">
        <CardTitle className="text-2xl font-semibold text-gray-800 mb-2">Daily Standup</CardTitle>
        <CardDescription className="text-gray-600">Share your progress and plans with the team</CardDescription>
      </CardHeader>
      
      <CardContent className="px-6 pb-8">
        {formState === "form" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="yesterday"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      What did you work on yesterday? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 transition-all duration-200 min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="today"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      What are you working on today? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 transition-all duration-200 min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blockers"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Any blockers? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 transition-all duration-200 min-h-[100px]"
                        placeholder="Enter 'None' if you don't have any blockers"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                      Highlights and Big Wins
                      <span className="ml-2 text-xs text-gray-500 font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 transition-all duration-200 min-h-[100px]"
                        placeholder="Share any achievements or milestones you're proud of"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full py-6 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                disabled={standupMutation.isPending}
              >
                {standupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Standup"
                )}
              </Button>
            </form>
          </Form>
        )}

        {formState === "success" && (
          <div className="space-y-6 py-10 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-800">Standup Submitted!</h3>
            <p className="text-gray-600">Your update has been successfully recorded.</p>
            <Button 
              onClick={handleSubmitAnother}
              variant="outline"
              className="mt-4 px-6 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-200 font-medium"
            >
              Submit Another
            </Button>
          </div>
        )}

        {formState === "error" && (
          <div className="space-y-6 py-10 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-800">Submission Failed</h3>
            <p className="text-gray-600">There was an error submitting your standup. Please try again.</p>
            <Button 
              onClick={handleTryAgain}
              variant="outline"
              className="mt-4 px-6 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-200 font-medium"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-500">
        Daily Standup App • Responses are stored securely
      </CardFooter>
    </Card>
  );
};

export default StandupForm;
