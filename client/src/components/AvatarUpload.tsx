import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fileToBase64 } from "@/lib/fileToBase64";

interface AvatarUploadProps {
  avatarUrl?: string | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
}

export function AvatarUpload({ avatarUrl, username, firstName, lastName }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [hovering, setHovering] = useState(false);

  // Get initials for avatar fallback
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return username[0].toUpperCase();
  };

  // Get display name for aria-label
  const getDisplayName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return username;
  };

  // Mutation for uploading avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (avatarBase64: string) => {
      const response = await apiRequest("POST", "/api/user/avatar", { avatar: avatarBase64 });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate user query to refresh the avatar
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update avatar",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.).",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      // Upload avatar
      uploadAvatarMutation.mutate(base64);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error processing image",
        description: "There was a problem processing your image. Please try again.",
      });
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div 
        className="relative cursor-pointer" 
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={handleUploadClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleUploadClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Change profile picture for ${getDisplayName()}`}
      >
        <Avatar className="h-24 w-24 border-2 border-primary/10">
          <AvatarImage src={avatarUrl || undefined} alt={getDisplayName()} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay on hover */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center transition-opacity ${
            hovering ? "opacity-100" : "opacity-0"
          }`}
        >
          <Camera className="h-8 w-8 text-white" />
        </div>
        
        {/* Loading overlay */}
        {uploadAvatarMutation.isPending && (
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mt-2">Click to change profile picture</p>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        aria-label="Upload profile picture"
      />
    </div>
  );
}