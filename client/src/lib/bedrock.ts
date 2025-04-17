import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  content: string;
  error?: string;
}

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function generateWithClaude(
  messages: ClaudeMessage[],
  modelId: string = "anthropic.claude-3-5-haiku-20240307-v1:0" // Using Claude 3.5 Haiku model that user has access to
): Promise<ClaudeResponse> {
  try {
    const promptMessages = messages.map((message) => ({
      role: message.role,
      content: [
        {
          type: "text",
          text: message.content,
        },
      ],
    }));

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4096,
      messages: promptMessages,
      temperature: 0.7,
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);

    return {
      content: parsedResponse.content[0].text,
    };
  } catch (error) {
    console.error("Error calling Claude:", error);
    return {
      content: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}