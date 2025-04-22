import { WeekendStoriesForm } from "@/components/WeekendStoriesForm";
import { WeekendStoriesList } from "@/components/WeekendStoriesList";

export default function WeekendStories() {
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Weekend Stories
      </h1>
      
      <div className="grid gap-8 grid-cols-1">
        <WeekendStoriesForm />
        <WeekendStoriesList />
      </div>
    </div>
  );
}