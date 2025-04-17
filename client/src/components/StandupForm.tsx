import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertStandupSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Logo } from "@/components/Logo";

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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, CheckCircle, AlertCircle, LogOut, CalendarIcon, User } from "lucide-react";

// Create a form schema for just the user input fields (without userId)
const formSchema = z.object({
  yesterday: z.string().min(1, "Please share what you worked on yesterday"),
  today: z.string().min(1, "Please share what you're working on today"),
  blockers: z.string().optional(),
  highlights: z.string().optional(),
  standupDate: z.date({
    required_error: "Please select a date for this standup",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  yesterday: "",
  today: "",
  blockers: "",
  highlights: "",
  standupDate: new Date(),
};

const StandupForm = () => {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
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
      // Invalidate the standups query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });
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
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to submit a standup."
      });
      return;
    }
    
    // Add the userId to the form data
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
      <CardHeader className="px-6 py-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Logo size="lg" withText={false} />
            <div className="ml-3">
              <CardTitle className="text-2xl font-semibold text-gray-800">Daily Standup</CardTitle>
              <CardDescription className="text-gray-600">Share your progress and plans with the team</CardDescription>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Logged in as <a href="/profile" className="font-semibold hover:underline">{user.username}</a>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                asChild
                className="text-gray-600 hover:text-gray-900"
              >
                <a href="/profile">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-gray-600 hover:text-gray-900"
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="ml-1">Logout</span>
              </Button>
            </div>
          )}
        </div>
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
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                      Any blockers?
                      <span className="ml-2 text-xs text-gray-500 font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 transition-all duration-200 min-h-[100px]"
                        placeholder="Share any challenges or obstacles you're facing (optional)"
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

              <FormField
                control={form.control}
                name="standupDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Standup Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal flex justify-between items-center"
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date this standup is for (defaults to today)
                    </FormDescription>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                variant="default"
                size="lg"
                className="w-full py-6 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-blue-500"
                disabled={standupMutation.isPending}
              >
                {standupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "SUBMIT STANDUP"
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
        DailyPulse • Responses are stored securely
      </CardFooter>
    </Card>
  );
};

export default StandupForm;
