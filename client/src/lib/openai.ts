import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

// Initialize OpenAI client when needed
function getOpenAIClient(): OpenAI {
  if (!openai) {
    // Since we're in a browser environment, need to ensure we don't try to access server-side env vars
    const apiKey = typeof window !== 'undefined' 
      ? import.meta.env.VITE_OPENAI_API_KEY || ""
      : process.env.OPENAI_API_KEY || "";
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function analyzeStandup(standupData: any, prompt: string): Promise<string> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
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
  } catch (error) {
    console.error("Error analyzing standup data:", error);
    return "An error occurred while analyzing the standup data. Please try again later.";
  }
}

export async function generateDefaultPrompts(standupData: any): Promise<string[]> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
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