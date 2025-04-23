import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { InsertWeekendStory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  description: z.string().min(1, "Please enter a description of your weekend"),
  images: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Default form values
const defaultValues: FormValues = {
  description: "",
  images: [],
};

export function WeekendStoriesForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const createWeekendStoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create the weekend story with description and image URLs
      const weekendStory: InsertWeekendStory = {
        userId: user!.id,
        description: data.description,
        images: data.images,
      };
      
      const res = await apiRequest("POST", "/api/weekend-stories", weekendStory);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form
      form.reset(defaultValues);
      setImageFiles([]);
      
      // Invalidate cache to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/weekend-stories'] });
      
      toast({
        title: "Weekend story shared!",
        description: "Your weekend story has been shared successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to share weekend story: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle image file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
  };

  // Convert and optimize File objects to base64 strings
  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    const MAX_WIDTH = 1200; // Maximum width for the image
    const MAX_HEIGHT = 1200; // Maximum height for the image
    const QUALITY = 0.7; // Image quality (0.7 = 70% quality)
    
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        // First convert the file to a data URL
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          // Create an image to resize
          const img = new Image();
          img.src = event.target?.result as string;
          
          img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }
            
            // Resize the image
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with reduced quality
            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
            resolve(dataUrl);
          };
          
          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };
        };
        
        reader.onerror = error => reject(error);
      });
    });
    
    return Promise.all(promises);
  };

  const onSubmit = async (data: FormValues) => {
    if (imageFiles.length > 0) {
      setIsUploading(true);
      try {
        // Convert images to base64 strings
        const imageUrls = await convertImagesToBase64(imageFiles);
        data.images = imageUrls;
        createWeekendStoryMutation.mutate(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image files",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      // Submit without images
      createWeekendStoryMutation.mutate(data);
    }
  };

  const isSubmitting = createWeekendStoryMutation.isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Weekend Story</CardTitle>
        <CardDescription>
          Tell your team what you did over the weekend. Add photos to share the highlights!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you do this weekend?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="I went hiking at Mount Rainier..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share your weekend adventures, activities, or anything interesting!
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Share Photos (optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Upload photos from your weekend (maximum 3 images)
              </FormDescription>
              
              {/* Preview selected files */}
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-24 w-24 object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0 h-6 w-6 p-0"
                        onClick={() => {
                          setImageFiles(imageFiles.filter((_, i) => i !== index));
                        }}
                        type="button"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share Weekend Story"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}