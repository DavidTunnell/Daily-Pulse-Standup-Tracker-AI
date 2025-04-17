import { useState, Fragment } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Standup, InsertStandup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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
import { Loader2, Plus, ChevronLeft, RefreshCw, Edit, Trash2, AlertCircle } from "lucide-react";

export default function StandupList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [standupToEdit, setStandupToEdit] = useState<Standup | null>(null);
  const [standupToDelete, setStandupToDelete] = useState<Standup | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: standups,
    isLoading,
    error,
    refetch,
  } = useQuery<Standup[]>({
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

  const formatDate = (dateString: Date | string) => {
    const date = typeof dateString === "string" 
      ? new Date(dateString) 
      : dateString;
    return format(date, "MMM d, yyyy h:mm a");
  };

  // Determine if current user is author of standup
  const isOwnStandup = (standup: Standup) => {
    return user && standup.userId === user.id;
  };
  
  // Handler for initiating an edit
  const handleEditStandup = (standup: Standup, e: React.MouseEvent) => {
    e.stopPropagation();
    setStandupToEdit(standup);
    setEditDialogOpen(true);
  };
  
  // Handler for initiating a delete
  const handleDeleteStandup = (standup: Standup, e: React.MouseEvent) => {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Standup History | Standup App</title>
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Standup History</h1>
          <p className="text-gray-600 mt-1">View all team standup submissions</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Form
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">
              <Plus className="h-4 w-4 mr-1" />
              New Standup
            </Link>
          </Button>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                  <TableHead className="w-[180px]">Created On</TableHead>
                  <TableHead className="w-[180px]">Standup Date</TableHead>
                  <TableHead>Yesterday</TableHead>
                  <TableHead>Today</TableHead>
                  <TableHead>Blockers</TableHead>
                  <TableHead>Highlights</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standups.map((standup) => (
                  <Fragment key={standup.id}>
                    <TableRow
                      className={`${
                        isOwnStandup(standup) ? "bg-blue-50" : ""
                      } hover:bg-gray-50 cursor-pointer`}
                      onClick={() => toggleExpandRow(standup.id)}
                    >
                      <TableCell className="font-medium">
                        {formatDate(standup.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {standup.standupDate ? formatDate(standup.standupDate) : "Today"}
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
                      <TableCell>
                        {isOwnStandup(standup) ? (
                          <span className="text-blue-600 font-medium">You</span>
                        ) : (
                          <span>User #{standup.userId}</span>
                        )}
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
                    </TableRow>
                    {expandedRow === standup.id && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={8} className="p-4">
                          <div className="mb-4">
                            <h3 className="font-medium text-gray-900 mb-2">
                              Standup for {standup.standupDate ? formatDate(standup.standupDate) : "Today"}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Submitted on {formatDate(standup.createdAt)}
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
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">No standups submitted yet.</p>
              <Button className="mt-4" asChild>
                <Link to="/">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Standup
                </Link>
              </Button>
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
      
      {/* Edit Standup Dialog - would be used with a form component */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Standup</DialogTitle>
            <DialogDescription>
              Update your standup details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {standupToEdit && (
            <div className="grid gap-4 py-4">
              {/* Here you would include a form component for editing the standup */}
              <p className="text-amber-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Edit functionality implementation pending
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Yesterday</h3>
                  <p className="text-sm text-gray-700">{standupToEdit.yesterday}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Today</h3>
                  <p className="text-sm text-gray-700">{standupToEdit.today}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Blockers</h3>
                  <p className="text-sm text-gray-700">{standupToEdit.blockers}</p>
                </div>
                {standupToEdit.highlights && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Highlights</h3>
                    <p className="text-sm text-gray-700">{standupToEdit.highlights}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={editMutation.isPending}
              onClick={() => {
                if (standupToEdit) {
                  editMutation.mutate({
                    id: standupToEdit.id,
                    data: {
                      yesterday: standupToEdit.yesterday,
                      today: standupToEdit.today,
                      blockers: standupToEdit.blockers,
                      highlights: standupToEdit.highlights,
                      userId: standupToEdit.userId,
                      standupDate: standupToEdit.standupDate
                    }
                  });
                }
              }}
            >
              {editMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}