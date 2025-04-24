import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WeekendStoryWithUsername } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WeekendStoriesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<WeekendStoryWithUsername | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch all weekend stories
  const { data: weekendStories, isLoading } = useQuery<WeekendStoryWithUsername[]>({
    queryKey: ['/api/weekend-stories'],
    queryFn: async () => {
      const response = await fetch('/api/weekend-stories');
      if (!response.ok) throw new Error('Failed to fetch weekend stories');
      return response.json();
    },
  });

  // Delete mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/weekend-stories/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekend-stories'] });
      toast({
        title: "Story deleted",
        description: "Your weekend story has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete weekend story: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteStory = (story: WeekendStoryWithUsername, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this weekend story?")) {
      deleteStoryMutation.mutate(story.id);
    }
  };

  // Check if user owns a story
  const isOwnStory = (story: WeekendStoryWithUsername) => {
    return user && story.userId === user.id;
  };

  // Format dates
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "PPP");
  };

  // Show full-size image in modal
  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!weekendStories || weekendStories.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No weekend stories shared yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <h2 className="text-2xl font-bold">Weekend Stories</h2>
      
      {weekendStories.map((story) => (
        <Card key={story.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-5">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={story.avatar || undefined} alt={story.username} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {story.firstName && story.lastName 
                      ? `${story.firstName[0]}${story.lastName[0]}`.toUpperCase()
                      : story.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>
                      {story.firstName && story.lastName 
                        ? `${story.firstName} ${story.lastName}` 
                        : story.username}
                    </span>
                    {isOwnStory(story) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{formatDate(story.createdAt)}</CardDescription>
                </div>
              </div>
              
              {/* Action buttons for own stories */}
              {isOwnStory(story) && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleDeleteStory(story, e)}
                    disabled={deleteStoryMutation.isPending}
                  >
                    {deleteStoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <p className="whitespace-pre-line">{story.description}</p>
            
            {/* Images gallery */}
            {story.images && story.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {story.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer overflow-hidden rounded-md"
                    onClick={() => openImageDialog(image)}
                  >
                    <img
                      src={image}
                      alt={`Photo from ${story.firstName && story.lastName 
                        ? `${story.firstName} ${story.lastName}` 
                        : story.username}'s weekend`}
                      className="h-48 w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Full size preview"
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}