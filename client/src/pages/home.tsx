import { Helmet } from 'react-helmet';
import StandupForm from "@/components/StandupForm";
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <Helmet>
        <title>Daily Standup | DailyPulse</title>
        <meta name="description" content="Submit your daily standup updates" />
      </Helmet>
      
      <StandupForm />
    </div>
  );
}
