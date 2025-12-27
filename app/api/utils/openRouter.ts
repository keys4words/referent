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

export const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  articleContent: string
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `${userPrompt}\n\n${articleContent}`,
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
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    throw new Error(errorData.error?.message || response.statusText);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const result = data.choices?.[0]?.message?.content;

  if (!result) {
    throw new Error("No response received from AI");
  }

  return result;
};

