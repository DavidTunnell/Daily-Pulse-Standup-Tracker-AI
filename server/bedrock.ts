import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize AWS Bedrock client with credentials
// Claude 3 models are available in us-east-1, us-west-2, and ap-northeast-1
const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1", // Forcing us-east-1 where Claude is available
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

// Available Claude models:
// - anthropic.claude-3-sonnet-20240229-v1:0 (Claude 3 Sonnet)
// - anthropic.claude-3-haiku-20240307-v1:0 (Claude 3 Haiku - fastest)
// - anthropic.claude-3-opus-20240229-v1:0 (Claude 3 Opus - most capable)
const CLAUDE_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0";

export async function analyzeStandupWithBedrock(standupData: any, prompt: string): Promise<string> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    
    // Claude message format
    const claudeMessage = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are an AI assistant specialized in analyzing standup data to provide insights and help teams work more effectively. Respond in a friendly, professional tone with actionable insights."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here's my standup data:\n${standupsJson}\n\nMy question is: ${prompt}`
            }
          ]
        }
      ]
    };

    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      body: JSON.stringify(claudeMessage),
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await bedrockClient.send(command);
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract the response content
    const content = responseBody.content?.[0]?.text || "Sorry, I couldn't analyze the standup data.";
    
    return content;
  } catch (error: any) {
    console.error("Error analyzing standup data with Bedrock:", error);
    
    // Check if it's a credential error
    if (error.name === "UnrecognizedClientException" || error.name === "AccessDeniedException") {
      throw new Error("AWS Bedrock API credentials are invalid. Please check your AWS configuration.");
    }
    
    // For other errors
    throw new Error("Failed to analyze standup data using AWS Bedrock. Please try again later.");
  }
}

export async function generatePromptSuggestionsWithBedrock(standupData: any): Promise<string[]> {
  try {
    const standupsJson = JSON.stringify(standupData, null, 2);
    
    // Claude message format
    const claudeMessage = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are an AI assistant that generates helpful prompt suggestions for analyzing standup data. Generate 5 useful prompts that would provide valuable insights about the standup data."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here's my standup data:\n${standupsJson}\n\nPlease generate 5 useful prompt suggestions as a JSON array with the following format: { "prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5"] }`
            }
          ]
        }
      ]
    };

    // Invoke the model
    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      body: JSON.stringify(claudeMessage),
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await bedrockClient.send(command);
    
    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract the response content and try to parse as JSON
    const content = responseBody.content?.[0]?.text || "";
    
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
    console.error("Error generating prompts with Bedrock:", error);
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