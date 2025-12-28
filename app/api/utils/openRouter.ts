export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

// Truncate content if it's too long to avoid token limit issues
const truncateContent = (content: string, maxLength: number = 8000): string => {
  if (content.length <= maxLength) {
    return content;
  }
  // Truncate and add note
  return content.substring(0, maxLength) + "\n\n[... статья обрезана из-за ограничений длины ...]";
};

export const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  articleContent: string,
  maxTokens: number = 2000
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  // Truncate article content if too long (roughly 8000 chars = ~2000 tokens)
  const truncatedContent = truncateContent(articleContent);

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `${userPrompt}\n\n${truncatedContent}`,
    },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Referent AI Translator",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as OpenRouterResponse & {
      error?: {
        message?: string;
        code?: string;
      };
    };
    
    const errorMessage = errorData.error?.message || response.statusText;
    
    // Check for token/credit limit errors
    if (errorMessage.includes("credits") || errorMessage.includes("max_tokens") || errorMessage.includes("afford")) {
      throw new Error("TOKEN_LIMIT_ERROR");
    }
    
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const result = data.choices?.[0]?.message?.content;

  if (!result) {
    throw new Error("No response received from AI");
  }

  return result;
};

