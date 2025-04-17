import { apiRequest } from "./queryClient";

// Use secure server-side API endpoints instead of directly accessing OpenAI

export async function analyzeStandup(standupData: any, prompt: string): Promise<string> {
  try {
    // Call the server API endpoint for analysis
    const response = await apiRequest("POST", "/api/analyze", { prompt });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to analyze standup data");
    }
    
    return data.analysis;
  } catch (error) {
    console.error("Error analyzing standup data:", error);
    throw error;
  }
}

export async function generateDefaultPrompts(standupData: any): Promise<string[]> {
  try {
    // Call the server API endpoint for prompt suggestions
    const response = await apiRequest("GET", "/api/prompt-suggestions");
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to generate prompt suggestions");
    }
    
    return Array.isArray(data.suggestions) ? data.suggestions : getDefaultPrompts();
  } catch (error) {
    console.error("Error generating prompts:", error);
    return getDefaultPrompts();
  }
}

function getDefaultPrompts(): string[] {
  return [
    "What are the recurring blockers in my team's standups?",
    "What trends do you see in our daily work?",
    "Summarize the main achievements from the past week",
    "What areas should our team focus on based on recent standups?",
    "Identify any potential risks or issues from our recent standups"
  ];
}