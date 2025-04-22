import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { NavBar } from "@/components/NavBar";
import { WeekendStoryWithUsername, InsertWeekendStory } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function WeekendStoryList() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [storyToDelete, setStoryToDelete] = useState<WeekendStoryWithUsername | null>(null);

  // Fetch all weekend stories
  const { data: stories, isLoading } = useQuery<WeekendStoryWithUsername[]>({
    queryKey: ["/api/weekend-stories"],
    staleTime: 10000, // 10 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/weekend-stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-stories"] });
      toast({
        title: "Weekend story deleted",
        description: "Your weekend story has been successfully deleted.",
      });
      setStoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting weekend story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if a story belongs to the current user
  const isOwnStory = (story: WeekendStoryWithUsername) => {
    return story.userId === user?.id;
  };

  // Handle edit story click
  const handleEditStory = (story: WeekendStoryWithUsername, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation(`/weekend-stories/${story.id}/edit`);
  };

  // Handle delete story click
  const handleDeleteStory = (story: WeekendStoryWithUsername, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStoryToDelete(story);
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (storyToDelete) {
      deleteMutation.mutate(storyToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Weekend Stories</h1>
          <Button asChild>
            <Link href="/weekend-stories/new">
              <Plus className="mr-2 h-4 w-4" /> Add New Story
            </Link>
          </Button>
        </div>

        {stories && stories.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Card key={story.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-medium">
                        By {story.username}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(story.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    {isOwnStory(story) && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleEditStory(story, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteStory(story, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="whitespace-pre-wrap">{story.story}</p>
                  {story.imageUrls && story.imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {story.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Weekend story image ${index + 1}`}
                          className="rounded-md object-cover w-full h-32"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No weekend stories yet</h3>
            <p className="text-muted-foreground mt-1">
              Share what you did this weekend with your team!
            </p>
            <Button asChild className="mt-4">
              <Link href="/weekend-stories/new">Create Your First Story</Link>
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!storyToDelete} onOpenChange={(open) => !open && setStoryToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this weekend story? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}