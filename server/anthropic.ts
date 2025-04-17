import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
// However, we'll use claude-3-opus-20240229 which should be available to most users
const MODEL = "claude-3-opus-20240229";

export async function analyzeStandupWithAnthropic(standupData: any, prompt: string): Promise<string> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key is not configured");
    }

    const standupsJson = JSON.stringify(standupData, null, 2);
    
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an AI assistant specialized in analyzing standup data to provide insights and help teams work more effectively. Respond in a friendly, professional tone with actionable insights.",
      messages: [
        { 
          role: 'user', 
          content: `Here's my standup data:\n${standupsJson}\n\nMy question is: ${prompt}`
        }
      ],
    });

    return message.content[0].text;
  } catch (error: any) {
    console.error("Error analyzing standup data with Anthropic:", error);
    
    if (error.message.includes("API key")) {
      throw new Error("Anthropic API key is invalid or not configured properly.");
    }
    
    throw new Error("Failed to analyze standup data using Anthropic. Please try again later.");
  }
}

export async function generatePromptSuggestionsWithAnthropic(standupData: any): Promise<string[]> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      return getDefaultPrompts();
    }

    const standupsJson = JSON.stringify(standupData, null, 2);
    
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: "You are an AI assistant that generates helpful prompt suggestions for analyzing standup data. Generate 5 useful prompts that would provide valuable insights about the standup data.",
      messages: [
        { 
          role: 'user', 
          content: `Here's my standup data:\n${standupsJson}\n\nPlease generate 5 useful prompt suggestions as a JSON array with the following format: { "prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"] }`
        }
      ],
    });

    const content = response.content[0].text;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsedJson.prompts)) {
          return parsedJson.prompts;
        }
      }
      return getDefaultPrompts();
    } catch (e) {
      return getDefaultPrompts();
    }
  } catch (error: any) {
    console.error("Error generating prompts with Anthropic:", error);
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