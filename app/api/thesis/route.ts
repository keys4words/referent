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

    // Call OpenRouter AI for thesis extraction
    const thesis = await callOpenRouter(
      "You are a professional content analyst. Analyze the following article and extract the main thesis statements and key points in Russian. Present them as a structured list of concise bullet points. Return only the thesis points without additional comments.",
      "Extract the main thesis and key points from this article in Russian:",
      parsed.content
    );

    return NextResponse.json({ thesis });
  } catch (error) {
    console.error("Thesis extraction error", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected error during thesis extraction";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

