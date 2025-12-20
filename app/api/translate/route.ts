import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type ParseResult = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const selectors = [
  "article",
  "[class*=post]",
  "[class*=content]",
  "[role=article]",
  "main",
];

const textFrom = ($: cheerio.CheerioAPI, selector: string) => {
  const node = $(selector).first();
  const text = node.text().trim();
  return text.length > 0 ? text : null;
};

const extractContent = ($: cheerio.CheerioAPI): string | null => {
  for (const selector of selectors) {
    const text = textFrom($, selector);
    if (text) return text;
  }
  return null;
};

const parseArticle = async (url: string): Promise<ParseResult> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  return {
    date: null,
    title: null,
    content: extractContent($),
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "URL is required in body: { url: string }" },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Parse the article
    const parsed = await parseArticle(url);
    if (!parsed.content) {
      return NextResponse.json(
        { error: "Could not extract content from the article" },
        { status: 400 }
      );
    }

    // Call OpenRouter AI for translation
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
        messages: [
          {
            role: "system",
            content: "You are a professional translator. Translate the following article to Russian. Preserve the original formatting, structure, and meaning. Return only the translated text without any additional comments or explanations.",
          },
          {
            role: "user",
            content: `Translate this article to Russian:\n\n${parsed.content}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: `Translation failed: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content;

    if (!translatedText) {
      return NextResponse.json(
        { error: "No translation received from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    console.error("Translation error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error during translation" },
      { status: 500 }
    );
  }
}

