import { useState, Fragment } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Standup } from "@shared/schema";

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
import { Loader2, Plus, ChevronLeft } from "lucide-react";

export default function StandupList() {
  const { user } = useAuth();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const {
    data: standups,
    isLoading,
    error,
  } = useQuery<Standup[]>({
    queryKey: ["/api/standups"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

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
        <CardHeader>
          <CardTitle>All Standups</CardTitle>
          <CardDescription>
            Review standup submissions from your team
          </CardDescription>
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
                      <TableCell>
                        {isOwnStandup(standup) ? (
                          <span className="text-blue-600 font-medium">You</span>
                        ) : (
                          <span>User #{standup.userId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                    {expandedRow === standup.id && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
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
    </div>
  );
}