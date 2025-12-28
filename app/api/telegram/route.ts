import { NextResponse } from "next/server";
import { parseArticle, ArticleFetchError } from "../utils/articleParser";
import { callOpenRouter } from "../utils/openRouter";

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

    // Parse the article
    const parsed = await parseArticle(url);
    if (!parsed.content) {
      return NextResponse.json(
        { error: "Could not extract content from the article" },
        { status: 400 }
      );
    }

    // Call OpenRouter AI for Telegram post generation
    const post = await callOpenRouter(
      "You are a social media content creator. Create an engaging Telegram post in Russian based on the following article. The post should be concise, informative, and suitable for Telegram format. Include relevant hashtags if appropriate. Return only the post content without additional comments.",
      "Create a Telegram post in Russian based on this article:",
      parsed.content
    );

    // Append the original article URL at the end
    const postWithLink = `${post}\n\n🔗 ${url}`;

    return NextResponse.json({ post: postWithLink });
  } catch (error) {
    console.error("Telegram post generation error", error);
    
    if (error instanceof ArticleFetchError) {
      return NextResponse.json(
        { error: "FETCH_ERROR", statusCode: error.statusCode, isTimeout: error.isTimeout },
        { status: 502 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected error during Telegram post generation";
    
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

