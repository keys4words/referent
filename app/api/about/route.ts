import { NextResponse } from "next/server";
import { parseArticle } from "../utils/articleParser";
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

    // Call OpenRouter AI for summary
    const summary = await callOpenRouter(
      "You are a professional content analyst. Analyze the following article and provide a concise summary in Russian explaining what the article is about. Focus on the main topic, key points, and purpose. Return only the summary without additional comments.",
      "What is this article about? Provide a summary in Russian:",
      parsed.content
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary error", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected error during summary generation";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

