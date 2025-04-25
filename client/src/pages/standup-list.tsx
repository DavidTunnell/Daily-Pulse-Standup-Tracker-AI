import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, startOfWeek, addDays, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Standup, InsertStandup, insertStandupSchema, StandupWithUsername } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  BarChart, 
  ChevronLeft, 
  Plus, 
  RefreshCw, 
  Pencil, 
  Trash, 
  Loader2, 
  Edit, 
  Trash2, 
  AlertCircle,
  Maximize2,
  CalendarRange, 
  Grid
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define the edit form schema
const editStandupSchema = insertStandupSchema.omit({ userId: true }).extend({
  standupDate: z.date().optional(),
  highlights: z.string().optional(),
});

type EditStandupFormValues = z.infer<typeof editStandupSchema>;

// Edit Form Component
interface EditStandupFormProps {
  standup: StandupWithUsername;
  onSubmit: (data: EditStandupFormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function EditStandupForm({ standup, onSubmit, isSubmitting, onCancel }: EditStandupFormProps) {
  // Convert string date to Date object for the form
  const standupDateObj = standup.standupDate ? new Date(standup.standupDate) : new Date();
  
  const form = useForm<EditStandupFormValues>({
    resolver: zodResolver(editStandupSchema),
    defaultValues: {
      yesterday: standup.yesterday,
      today: standup.today,
      blockers: standup.blockers,
      highlights: standup.highlights || undefined,
      standupDate: standupDateObj,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="yesterday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What did you do yesterday?</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tasks completed, meetings attended, etc."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="today"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What will you do today?</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tasks planned, upcoming meetings, etc."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="blockers"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Any blockers?
                <span className="ml-2 text-xs text-gray-500 font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share any challenges or obstacles you're facing (optional)"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="highlights"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Highlights / Big Wins (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Key accomplishments, breakthroughs, etc."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="standupDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Standup Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className="pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function StandupList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [standupToEdit, setStandupToEdit] = useState<StandupWithUsername | null>(null);
  const [standupToDelete, setStandupToDelete] = useState<StandupWithUsername | null>(null);
  const [fullPageStandup, setFullPageStandup] = useState<StandupWithUsername | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fullPageModalOpen, setFullPageModalOpen] = useState(false);
  const [weeklyViewOpen, setWeeklyViewOpen] = useState(false);

  const {
    data: standups,
    isLoading,
    error,
    refetch,
  } = useQuery<StandupWithUsername[]>({
    queryKey: ["/api/standups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/standups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Standup deleted",
        description: "Your standup has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete standup",
        variant: "destructive",
      });
    },
  });
  
  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertStandup }) => {
      const response = await apiRequest("PUT", `/api/standups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Standup updated",
        description: "Your standup has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update standup",
        variant: "destructive",
      });
    },
  });
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const toggleExpandRow = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const formatDateTime = (dateString: Date | string) => {
    const date = typeof dateString === "string" 
      ? new Date(dateString) 
      : dateString;
    return format(date, "MMM d, yyyy h:mm a");
  };
  
  const formatDateOnly = (dateString: Date | string) => {
    const date = typeof dateString === "string" 
      ? new Date(dateString) 
      : dateString;
    return format(date, "MMM d, yyyy");
  };

  // Determine if current user is author of standup
  const isOwnStandup = (standup: StandupWithUsername) => {
    return user && standup.userId === user.id;
  };
  
  // Handler for initiating an edit
  const handleEditStandup = (standup: StandupWithUsername, e: React.MouseEvent) => {
    e.stopPropagation();
    setStandupToEdit(standup);
    setEditDialogOpen(true);
  };
  
  // Handler for initiating a delete
  const handleDeleteStandup = (standup: StandupWithUsername, e: React.MouseEvent) => {
    e.stopPropagation();
    setStandupToDelete(standup);
    setDeleteDialogOpen(true);
  };
  
  // Handler for confirming deletion
  const confirmDelete = () => {
    if (standupToDelete) {
      deleteMutation.mutate(standupToDelete.id);
    }
  };
  
  // Handler for opening the full-page modal
  const openFullPageModal = (standup: StandupWithUsername, e: React.MouseEvent) => {
    e.stopPropagation();
    setFullPageStandup(standup);
    setFullPageModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Standup History | DailyPulse</title>
      </Helmet>

      <div className="mb-8">
        <div className="flex items-center">
          <Logo size="lg" withText={false} className="mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Standup History</h1>
            <p className="text-gray-600 mt-1">View all team standup submissions</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Standups</CardTitle>
            <CardDescription>
              Review standup submissions from your team
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setWeeklyViewOpen(true)}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Weekly View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-500">
                There was an error loading the standups. Please try again.
              </p>
            </div>
          ) : standups && standups.length > 0 ? (
            <Table>
              <TableCaption>List of all standup entries</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-[180px]">Standup Date</TableHead>
                  <TableHead>Yesterday</TableHead>
                  <TableHead>Today</TableHead>
                  <TableHead>Blockers</TableHead>
                  <TableHead>Highlights</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standups.map((standup) => [
                  <TableRow
                    key={`row-${standup.id}`}
                    className={`${
                      isOwnStandup(standup) ? "bg-blue-50" : ""
                    } hover:bg-gray-50 cursor-pointer`}
                    onClick={() => toggleExpandRow(standup.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-5">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={standup.avatar || undefined} alt={standup.username} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {standup.firstName && standup.lastName 
                              ? `${standup.firstName[0]}${standup.lastName[0]}`.toUpperCase()
                              : standup.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={isOwnStandup(standup) ? "text-blue-600 font-medium" : ""}>
                          {standup.firstName && standup.lastName 
                            ? `${standup.firstName} ${standup.lastName}` 
                            : standup.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {standup.standupDate ? formatDateOnly(standup.standupDate) : "Today"}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {standup.yesterday}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {standup.today}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {standup.blockers}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {standup.highlights || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandRow(standup.id);
                          }}
                        >
                          {expandedRow === standup.id ? "Hide" : "View"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => openFullPageModal(standup, e)}
                        >
                          <Maximize2 className="h-4 w-4 mr-1" />
                          Expand
                        </Button>
                        
                        {isOwnStandup(standup) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditStandup(standup, e)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteStandup(standup, e)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>,
                  expandedRow === standup.id && (
                    <TableRow key={`expanded-${standup.id}`} className="bg-gray-50">
                      <TableCell colSpan={7} className="p-4">
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 mb-2">
                            Standup for {standup.standupDate ? formatDateOnly(standup.standupDate) : "Today"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Submitted on {formatDateTime(standup.createdAt)}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                              Yesterday
                            </h3>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {standup.yesterday}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                              Today
                            </h3>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {standup.today}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                              Blockers
                            </h3>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {standup.blockers}
                            </p>
                          </div>
                          {standup.highlights && (
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2">
                                Highlights
                              </h3>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {standup.highlights}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ])}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No standups submitted yet.</p>
              <p className="text-gray-500 mt-2">Use the "Enter Standup" button in the navbar to create your first standup.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              standup record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Standup Dialog with Form */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        // Reset form when dialog closes
        if (!open) {
          setStandupToEdit(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Standup</DialogTitle>
            <DialogDescription>
              Update your standup details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          {standupToEdit && <EditStandupForm 
            standup={standupToEdit} 
            onSubmit={(data) => {
              // Convert Date to string for API request
              const formattedData = {
                ...data,
                userId: standupToEdit.userId,
                // Convert Date to ISO string for backend
                standupDate: data.standupDate ? data.standupDate.toISOString() : undefined
              };
              
              editMutation.mutate({
                id: standupToEdit.id,
                data: formattedData
              });
            }} 
            isSubmitting={editMutation.isPending} 
            onCancel={() => setEditDialogOpen(false)} 
          />}
        </DialogContent>
      </Dialog>

      {/* Full Page Modal */}
      <Sheet 
        open={fullPageModalOpen} 
        onOpenChange={(open) => {
          setFullPageModalOpen(open);
          if (!open) {
            setFullPageStandup(null);
          }
        }}
      >
        <SheetContent className="h-screen flex flex-col p-0" side="bottom">
          {fullPageStandup && (
            <div className="flex flex-col h-full">
              <SheetHeader className="px-6 py-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center gap-5">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={fullPageStandup.avatar || undefined} alt={fullPageStandup.username} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {fullPageStandup.firstName && fullPageStandup.lastName 
                        ? `${fullPageStandup.firstName[0]}${fullPageStandup.lastName[0]}`.toUpperCase()
                        : fullPageStandup.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-left text-2xl">
                      {fullPageStandup.firstName && fullPageStandup.lastName 
                        ? `${fullPageStandup.firstName} ${fullPageStandup.lastName}'s Standup` 
                        : `${fullPageStandup.username}'s Standup`}
                    </SheetTitle>
                    <SheetDescription className="text-left">
                      {fullPageStandup.standupDate 
                        ? formatDateOnly(fullPageStandup.standupDate) 
                        : "Today"} - Submitted on {formatDateTime(fullPageStandup.createdAt)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">
                      What did you work on yesterday?
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                      {fullPageStandup.yesterday}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-green-800 mb-4">
                      What will you work on today?
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                      {fullPageStandup.today}
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-amber-800 mb-4">
                      Any blockers?
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                      {fullPageStandup.blockers || "No blockers reported."}
                    </p>
                  </div>
                  
                  {fullPageStandup.highlights && (
                    <div className="bg-purple-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-purple-800 mb-4">
                        Highlights / Big Wins
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                        {fullPageStandup.highlights}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t p-4 flex justify-end gap-2 bg-white sticky bottom-0">
                <Button 
                  variant="outline" 
                  onClick={() => setFullPageModalOpen(false)}
                >
                  Close
                </Button>
                {isOwnStandup(fullPageStandup) && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        setFullPageModalOpen(false);
                        handleEditStandup(fullPageStandup, e as React.MouseEvent<HTMLButtonElement>);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={(e) => {
                        setFullPageModalOpen(false);
                        handleDeleteStandup(fullPageStandup, e as React.MouseEvent<HTMLButtonElement>);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Weekly View Dialog */}
      <Sheet 
        open={weeklyViewOpen}
        onOpenChange={setWeeklyViewOpen}
      >
        <SheetContent className="h-screen flex flex-col overflow-auto w-full max-w-full" side="right">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="text-2xl">Weekly Standup Overview</SheetTitle>
            <SheetDescription>
              View all standups organized by date and team member
            </SheetDescription>
          </SheetHeader>
          
          {standups && standups.length > 0 ? (
            <div className="h-full">
              <div className="grid grid-cols-7 gap-1">
                <div className="p-2 bg-gray-100 rounded-tl-md">
                  <div className="flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  </div>
                </div>
                {['Monday, April 21', 'Tuesday, April 22', 'Wednesday, April 23', 'Thursday, April 24', 'Friday, April 25'].map((day, i) => (
                  <div key={i} className="p-2 font-medium text-center bg-blue-50 border-b border-blue-200">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 mt-1">
                <div className="sticky left-0 p-2 bg-gray-100">
                  <div className="text-sm font-medium text-center mb-2">Today</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={`today-${i}`} className="p-2 bg-emerald-50 border border-emerald-100 min-h-[100px]">
                    {standups.filter(s => s.standupDate && 
                      format(new Date(s.standupDate), 'EEE, MMM d') === 
                      format(addDays(new Date('2025-04-21'), i), 'EEE, MMM d')
                    ).map(s => (
                      <div key={`today-item-${s.id}`} className="text-xs mb-2">
                        {s.today}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 mt-1">
                <div className="sticky left-0 p-2 bg-gray-100">
                  <div className="text-sm font-medium text-center mb-2">Blockers</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={`blockers-${i}`} className="p-2 bg-amber-50 border border-amber-100 min-h-[100px]">
                    {standups.filter(s => s.standupDate && 
                      format(new Date(s.standupDate), 'EEE, MMM d') === 
                      format(addDays(new Date('2025-04-21'), i), 'EEE, MMM d')
                    ).map(s => (
                      <div key={`blockers-item-${s.id}`} className="text-xs mb-2">
                        {s.blockers || "No blockers"}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 mt-1">
                <div className="sticky left-0 p-2 bg-gray-100 rounded-bl-md">
                  <div className="text-sm font-medium text-center mb-2">Yesterday</div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={`yesterday-${i}`} className="p-2 bg-blue-50 border border-blue-100 min-h-[100px]">
                    {standups.filter(s => s.standupDate && 
                      format(new Date(s.standupDate), 'EEE, MMM d') === 
                      format(addDays(new Date('2025-04-21'), i), 'EEE, MMM d')
                    ).map(s => (
                      <div key={`yesterday-item-${s.id}`} className="text-xs mb-2">
                        {s.yesterday}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-2">No standups data available for the week.</p>
              <Button onClick={() => setWeeklyViewOpen(false)} variant="outline" size="sm">
                Close
              </Button>
            </div>
          )}
          
          <div className="border-t pt-4 mt-auto flex justify-end">
            <Button onClick={() => setWeeklyViewOpen(false)}>
              Close Weekly View
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}