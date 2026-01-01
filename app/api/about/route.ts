import { NextResponse } from "next/server";
import { parseArticle, ArticleFetchError } from "../utils/articleParser";
import { callOpenRouter } from "../utils/openRouter";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const textContent = typeof body?.text === "string" ? body.text.trim() : "";

    let articleContent: string;

    // Support both URL and direct text input
    if (textContent) {
      articleContent = textContent;
    } else if (url) {
      // Parse the article
      let parsed;
      try {
        parsed = await parseArticle(url);
      } catch (error) {
        if (error instanceof ArticleFetchError && error.statusCode === 403) {
          return NextResponse.json(
            { error: "PAYWALL_ERROR" },
            { status: 403 }
          );
        }
        throw error;
      }
      
      if (!parsed.content) {
        return NextResponse.json(
          { error: "Could not extract content from the article" },
          { status: 400 }
        );
      }
      articleContent = parsed.content;
    } else {
      return NextResponse.json(
        { error: "URL or text content is required in body: { url?: string, text?: string }" },
        { status: 400 }
      );
    }

    // Call OpenRouter AI for summary
    const summary = await callOpenRouter(
      "You are a professional content analyst. Analyze the following article (which may be in any language) and provide a concise summary in Russian explaining what the article is about. If the article is not in Russian, translate and analyze it. Focus on the main topic, key points, and purpose. Return only the summary in Russian without additional comments.",
      "What is this article about? The article may be in any language. Provide a summary in Russian:",
      articleContent
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary error", error);
    
    if (error instanceof ArticleFetchError) {
      return NextResponse.json(
        { error: "FETCH_ERROR", statusCode: error.statusCode, isTimeout: error.isTimeout },
        { status: 502 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected error during summary generation";
    
    // Check for token/credit limit errors
    if (errorMessage === "TOKEN_LIMIT_ERROR") {
      return NextResponse.json(
        { error: "TOKEN_LIMIT_ERROR" },
        { status: 402 }
      );
    }
    
    // Check if it's an OpenRouter API error
    if (errorMessage.includes("OPENROUTER_API_KEY") || errorMessage.includes("OpenRouter")) {
      return NextResponse.json(
        { error: "API_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "PROCESSING_ERROR" },
      { status: 500 }
    );
  }
}

