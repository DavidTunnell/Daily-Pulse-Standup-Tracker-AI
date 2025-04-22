import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NavBar } from "@/components/NavBar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertWeekendStorySchema, WeekendStory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";

// Extend the schema for form validation
const formSchema = insertWeekendStorySchema.extend({
  story: z.string().min(1, "Please share your weekend experience"),
  // URL validation for images (placeholder for now, will be replaced with file upload)
  images: z.array(z.instanceof(File)).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function WeekendStoryForm() {
  const params = useParams();
  const storyId = params.id ? parseInt(params.id) : undefined;
  const isEditMode = !!storyId;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      story: "",
      images: [],
    },
  });

  // Fetch weekend story for editing
  const { data: weekendStory, isLoading: isLoadingStory } = useQuery<WeekendStory>({
    queryKey: ["/api/weekend-stories", storyId],
    queryFn: async () => {
      if (!storyId) return undefined;
      const res = await apiRequest("GET", `/api/weekend-stories/${storyId}`);
      return await res.json();
    },
    enabled: isEditMode,
  });

  // Update form values when weekend story data is loaded
  useEffect(() => {
    if (weekendStory) {
      form.setValue("story", weekendStory.story);
      // Display existing images if they exist
      if (weekendStory.imageUrls && weekendStory.imageUrls.length > 0) {
        setImagePreviewUrls(weekendStory.imageUrls as string[]);
      }
    }
  }, [weekendStory, form]);

  // Create weekend story mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Handle file uploads (placeholder for now)
      // In a real implementation, you would upload these to a server or storage service
      // and get back URLs to store in the database
      
      // For demonstration purposes, we're just creating fake URLs
      const imageUrls = imageFiles.map((_, index) => 
        `https://placeholder-image-url.com/image-${index}.jpg`
      );
      
      const payload = {
        story: data.story,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
      
      const res = await apiRequest("POST", "/api/weekend-stories", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-stories"] });
      toast({
        title: "Weekend story created",
        description: "Your weekend story has been successfully created.",
      });
      setLocation("/weekend-stories");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating weekend story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update weekend story mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!storyId) return;

      // Handle file uploads (placeholder for now)
      // In a real implementation, you would upload these to a server or storage service
      
      // For demonstration purposes, we're preserving existing URLs and adding fake ones for new files
      const newImageUrls = imageFiles.map((_, index) => 
        `https://placeholder-image-url.com/image-${Date.now()}-${index}.jpg`
      );
      
      // Get existing image URLs that haven't been removed
      const existingImageUrls = weekendStory?.imageUrls || [];
      
      const payload = {
        story: data.story,
        imageUrls: [...existingImageUrls, ...newImageUrls],
      };
      
      const res = await apiRequest("PUT", `/api/weekend-stories/${storyId}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-stories", storyId] });
      toast({
        title: "Weekend story updated",
        description: "Your weekend story has been successfully updated.",
      });
      setLocation("/weekend-stories");
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating weekend story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);
    
    // Create image previews
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls]);
  };

  // Remove image
  const removeImage = (index: number) => {
    if (index < imagePreviewUrls.length) {
      // Remove the preview URL
      const updatedUrls = [...imagePreviewUrls];
      const removed = updatedUrls.splice(index, 1)[0];
      setImagePreviewUrls(updatedUrls);
      
      // Revoke the object URL if it's a newly added image
      if (removed.startsWith('blob:')) {
        URL.revokeObjectURL(removed);
      }
      
      // If it's a new file, also remove it from files array
      if (index < imageFiles.length) {
        const updatedFiles = [...imageFiles];
        updatedFiles.splice(index, 1);
        setImageFiles(updatedFiles);
      }
    }
  };

  if (isEditMode && isLoadingStory) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Weekend Story" : "New Weekend Story"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="story"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How was your weekend?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share your weekend experience with your team..."
                          className="min-h-32 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Photos (optional)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden h-32">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-full object-cover" 
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                            onClick={() => removeImage(index)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <CardFooter className="px-0 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/weekend-stories")}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update Story" : "Share Story"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}