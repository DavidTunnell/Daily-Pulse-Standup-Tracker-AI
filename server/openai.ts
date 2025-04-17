import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export async function analyzeStandup(standupData: any, prompt: string): Promise<string> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant specialized in analyzing standup data to provide insights and help teams work more effectively. " +
            "Respond in a friendly, professional tone with actionable insights."
        },
        {
          role: "user",
          content: `Here's my standup data:\n${standupsJson}\n\nMy question is: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Sorry, I couldn't analyze the standup data.";
  } catch (error: any) {
    console.error("Error analyzing standup data:", error);
    
    // Check if it's a rate limit error from OpenAI
    const isRateLimitError = 
      typeof error === 'object' && 
      error !== null && 
      (error.status === 429 || 
       (error.error && typeof error.error === 'object' && error.error.code === 'insufficient_quota'));
    
    if (isRateLimitError) {
      throw new Error("OpenAI API quota exceeded. Please try again later or contact the administrator to update the API key.");
    }
    
    // For other errors
    throw new Error("Failed to analyze standup data. Please try again later.");
  }
}

export async function generatePromptSuggestions(standupData: any): Promise<string[]> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant that generates helpful prompt suggestions for analyzing standup data. " +
            "Generate 5 useful prompts that would provide valuable insights about the standup data."
        },
        {
          role: "user",
          content: `Here's my standup data:\n${standupsJson}\n\nPlease generate 5 useful prompt suggestions.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    try {
      const content = response.choices[0].message.content;
      if (!content) return getDefaultPrompts();
      
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.prompts) ? parsed.prompts : getDefaultPrompts();
    } catch (e) {
      return getDefaultPrompts();
    }
  } catch (error: any) {
    console.error("Error generating prompts:", error);
    
    // For rate limit errors, log more clearly but still return default prompts
    const isRateLimitError = 
      typeof error === 'object' && 
      error !== null && 
      (error.status === 429 || 
       (error.error && typeof error.error === 'object' && error.error.code === 'insufficient_quota'));
    
    if (isRateLimitError) {
      console.log("OpenAI API quota exceeded when generating prompts. Using default prompts instead.");
    }
    
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