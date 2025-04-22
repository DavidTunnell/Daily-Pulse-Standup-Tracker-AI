import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import StandupList from "@/pages/standup-list";
import StandupAnalysis from "@/pages/standup-analysis";
import ProfilePage from "@/pages/profile-page";
import WeekendStoryList from "@/pages/weekend-story-list";
import WeekendStoryForm from "@/pages/weekend-story-form";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/standups" component={StandupList} />
      <ProtectedRoute path="/analysis" component={StandupAnalysis} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/weekend-stories" component={WeekendStoryList} />
      <ProtectedRoute path="/weekend-stories/new" component={WeekendStoryForm} />
      <ProtectedRoute path="/weekend-stories/:id/edit" component={WeekendStoryForm} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
