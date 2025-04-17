import { Helmet } from 'react-helmet';
import StandupForm from "@/components/StandupForm";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4 font-sans">
      <Helmet>
        <title>Daily Standup Form</title>
        <meta name="description" content="Submit your daily standup updates" />
      </Helmet>
      <StandupForm />
    </div>
  );
}
