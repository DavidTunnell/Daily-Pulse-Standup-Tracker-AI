import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { ClipboardList } from 'lucide-react';
import StandupForm from "@/components/StandupForm";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <Helmet>
        <title>Daily Standup Form</title>
        <meta name="description" content="Submit your daily standup updates" />
      </Helmet>
      
      <div className="fixed top-4 right-4">
        <Button variant="outline" asChild size="sm" className="shadow-sm">
          <Link to="/standups">
            <ClipboardList className="h-4 w-4 mr-2" />
            View All Standups
          </Link>
        </Button>
      </div>
      
      <StandupForm />
    </div>
  );
}
